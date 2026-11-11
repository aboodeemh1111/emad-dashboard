"""Native Emad dashboard: local storage, optimistic writes, and live layouts.

Device state and commands use Home Assistant's existing permission-checked API.
This module stores presentation only; no credentials, templates, or executable CSS.
"""
from __future__ import annotations

import asyncio
from copy import deepcopy
from typing import Any, TYPE_CHECKING, cast

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.util.json import load_json

from .const import DOMAIN, STORAGE_KEY as KEY, SIGNAL

if TYPE_CHECKING:
    from . import DashboardRuntime
CARD = vol.Schema({
    vol.Required("id"): vol.All(str, vol.Length(min=1, max=80)),
    vol.Required("kind"): vol.In(("device", "clock", "text")),
    vol.Optional("entity"): vol.All(str, vol.Match(r"^[a-z_]+\.[a-z0-9_]+$"), vol.Length(max=255)),
    vol.Optional("deviceType"): vol.All(str, vol.Match(r"^[a-z][a-z0-9_]{0,79}$")),
    vol.Optional("deviceId"): vol.All(str, vol.Match(r"^[a-zA-Z0-9_-]+\Z"), vol.Length(min=1, max=128)),
    vol.Optional("title"): vol.All(str, vol.Length(max=120)),
    vol.Optional("text"): vol.All(str, vol.Length(max=4000)),
    vol.Required("x"): vol.All(int, vol.Range(min=0, max=960)),
    vol.Required("y"): vol.All(int, vol.Range(min=0, max=20000)),
    vol.Required("w"): vol.All(int, vol.Range(min=240, max=1200)),
    vol.Required("h"): vol.All(int, vol.Range(min=204, max=1200)),
})
CONFIG = vol.Schema({
    vol.Required("version"): 1,
    vol.Required("views"): vol.All([{
        vol.Required("id"): vol.All(str, vol.Length(min=1, max=80)),
        vol.Required("name"): vol.All(str, vol.Length(max=120)),
        vol.Required("cards"): vol.All([CARD], vol.Length(max=100)),
    }], vol.Length(min=1, max=30)),
})


def validate_config(value: dict[str, Any]) -> dict[str, Any]:
    config = CONFIG(value)
    view_ids: set[str] = set()
    card_ids: set[str] = set()
    for view in config["views"]:
        if view["id"] in view_ids:
            raise vol.Invalid("Duplicate view")
        view_ids.add(view["id"])
        for card in view["cards"]:
            if card["id"] in card_ids or card["x"] + card["w"] > 1200:
                raise vol.Invalid("Invalid card placement")
            if card["kind"] == "device" and not (card.get("entity") or card.get("deviceType")):
                raise vol.Invalid("Device card requires an entity or device type")
            card_ids.add(card["id"])
    return config


class DashboardStore:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.store = Store(hass, 1, KEY, atomic_writes=True)
        self.lock = asyncio.Lock()
        self.snapshot: dict[str, Any] = {
            "revision": 0, "config": {"version": 1, "views": [{"id": "home", "name": "", "cards": []}]}
        }

    async def async_load(self) -> None:
        if (saved := await self.store.async_load()) is not None:
            validate_config(saved["config"])
            self.snapshot = saved

    async def async_save(self, revision: int, config: dict[str, Any]) -> dict[str, Any]:
        config = deepcopy(validate_config(config))
        async with self.lock:
            if revision != self.snapshot["revision"]:
                raise ValueError("conflict")
            snapshot = {"revision": revision + 1, "config": config}
            # Publish only after the atomic storage write succeeds.
            await self.store.async_save(snapshot)
            # Store logs write errors rather than propagating them. Verify the
            # durable record before acknowledging or broadcasting a new revision.
            persisted = await self.hass.async_add_executor_job(load_json, self.store.path)
            if persisted.get("data") != snapshot:
                raise OSError("Dashboard storage write did not persist")
            self.snapshot = snapshot
            async_dispatcher_send(self.hass, SIGNAL)
            return deepcopy(snapshot)


@callback
def async_register_commands(hass: HomeAssistant) -> None:
    for handler in (ws_get, ws_save, ws_subscribe):
        websocket_api.async_register_command(hass, handler)


def _runtime(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> DashboardRuntime | None:
    runtime = cast("DashboardRuntime | None", hass.data.get(DOMAIN))
    if runtime is None or not runtime.active:
        connection.send_error(msg["id"], "integration_not_loaded", "Emad dashboard is not loaded")
        return None
    return runtime


@websocket_api.websocket_command({vol.Required("type"): "emad_dashboard/dashboard/get"})
@callback
def ws_get(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (runtime := _runtime(hass, connection, msg)) is not None:
        connection.send_result(msg["id"], runtime.store.snapshot)


@websocket_api.websocket_command({
    vol.Required("type"): "emad_dashboard/dashboard/save",
    vol.Required("revision"): vol.All(int, vol.Range(min=0)),
    vol.Required("config"): dict,
})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_save(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (runtime := _runtime(hass, connection, msg)) is None:
        return
    try:
        result = await runtime.store.async_save(msg["revision"], msg["config"])
    except vol.Invalid:
        connection.send_error(msg["id"], "invalid_config", "Invalid dashboard configuration")
    except ValueError:
        connection.send_error(msg["id"], "conflict", "Dashboard changed on another screen")
    except OSError:
        connection.send_error(msg["id"], "save_failed", "Could not save dashboard")
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): "emad_dashboard/dashboard/subscribe"})
@callback
def ws_subscribe(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    if (runtime := _runtime(hass, connection, msg)) is None:
        return
    @callback
    def push() -> None:
        if runtime.active:
            connection.send_event(msg["id"], runtime.store.snapshot)
    remove_listener = async_dispatcher_connect(hass, SIGNAL, push)
    unsubscribed = False
    @callback
    def unsubscribe() -> None:
        nonlocal unsubscribed
        if unsubscribed:
            return
        unsubscribed = True
        remove_listener()
        runtime.unsubscribers.discard(unsubscribe)
    runtime.unsubscribers.add(unsubscribe)
    connection.subscriptions[msg["id"]] = unsubscribe
    connection.send_result(msg["id"])
    push()
