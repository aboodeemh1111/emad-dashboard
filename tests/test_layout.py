"""Dashboard persistence, permissions, conflict handling, and subscription contract."""
from copy import deepcopy
from unittest.mock import patch
import asyncio
import pytest
import voluptuous as vol
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from homeassistant.util.file import WriteError
from custom_components.emad_dashboard.layout import DashboardStore, KEY, validate_config
from custom_components.emad_dashboard.const import DOMAIN

CONFIG = {"version":1,"views":[{"id":"home","name":"Home","cards":[{"id":"light","kind":"device","entity":"light.lobby","x":0,"y":0,"w":384,"h":348}]}]}

@pytest.fixture
def hass_storage():
    # Exercise the real atomic writer, including its logged-error behavior.
    yield {}

@pytest.fixture
def hass_config_dir(tmp_path):
    return str(tmp_path)

@pytest.fixture
async def setup_dashboard(hass):
    from pytest_homeassistant_custom_component.common import MockConfigEntry
    entry=MockConfigEntry(domain=DOMAIN,unique_id=DOMAIN,data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    yield entry

@pytest.mark.parametrize("patch_card",[{"x":1000},{"w":0},{"h":-1},{"entity":"invalid"},{"kind":"script"},{"style":"url(evil)"}])
def test_reject_invalid_cards(patch_card):
    config=deepcopy(CONFIG);config["views"][0]["cards"][0].update(patch_card)
    with pytest.raises(vol.Invalid):validate_config(config)

def test_reject_duplicate_ids_and_missing_entities():
    config=deepcopy(CONFIG);config["views"].append(deepcopy(config["views"][0]))
    with pytest.raises(vol.Invalid):validate_config(config)
    config=deepcopy(CONFIG);config["views"][0]["cards"].append(deepcopy(config["views"][0]["cards"][0]))
    with pytest.raises(vol.Invalid):validate_config(config)
    config=deepcopy(CONFIG);del config["views"][0]["cards"][0]["entity"]
    with pytest.raises(vol.Invalid):validate_config(config)

async def test_persists_revision_and_rejects_concurrent_writers(hass:HomeAssistant):
    store=DashboardStore(hass);await store.async_load()
    results=await asyncio.gather(store.async_save(0,CONFIG),store.async_save(0,CONFIG),return_exceptions=True)
    assert sum(isinstance(result,ValueError) for result in results)==1
    reloaded=DashboardStore(hass);await reloaded.async_load()
    assert reloaded.snapshot=={"revision":1,"config":CONFIG}
    CONFIG_COPY=deepcopy(CONFIG);snapshot=await reloaded.async_save(1,CONFIG_COPY)
    CONFIG_COPY["views"][0]["name"]="changed";snapshot["config"]["views"][0]["name"]="also changed"
    assert reloaded.snapshot["config"]["views"][0]["name"]=="Home"

async def test_failed_storage_write_keeps_the_previous_revision(hass):
    store=DashboardStore(hass)
    with patch.object(store.store,"async_save",side_effect=OSError("disk full")):
        with pytest.raises(OSError):await store.async_save(0,CONFIG)
    assert store.snapshot["revision"]==0

async def test_admin_saves_and_viewers_receive_live_updates(hass,hass_ws_client,hass_read_only_access_token,setup_dashboard):
    viewer=await hass_ws_client(hass,hass_read_only_access_token)
    await viewer.send_json({"id":1,"type":"emad_dashboard/dashboard/subscribe"})
    assert (await viewer.receive_json())["success"]
    assert (await viewer.receive_json())["event"]["revision"]==0
    await viewer.send_json({"id":2,"type":"emad_dashboard/dashboard/save","revision":0,"config":CONFIG})
    assert (await viewer.receive_json())["error"]["code"]=="unauthorized"
    admin=await hass_ws_client(hass)
    await admin.send_json({"id":1,"type":"emad_dashboard/dashboard/save","revision":0,"config":CONFIG})
    assert (await admin.receive_json())["result"]["revision"]==1
    assert (await viewer.receive_json())["event"]=={"revision":1,"config":CONFIG}
    await admin.send_json({"id":2,"type":"emad_dashboard/dashboard/save","revision":0,"config":CONFIG})
    assert (await admin.receive_json())["error"]["code"]=="conflict"
    await viewer.send_json({"id":3,"type":"emad_dashboard/dashboard/get"})
    assert (await viewer.receive_json())["result"]["revision"]==1
    await viewer.send_json({"id":4,"type":"unsubscribe_events","subscription":1})
    assert (await viewer.receive_json())["success"]

async def test_invalid_websocket_config_is_rejected(hass,hass_ws_client,setup_dashboard):
    admin=await hass_ws_client(hass)
    await admin.send_json({"id":1,"type":"emad_dashboard/dashboard/save","revision":0,"config":{}})
    assert (await admin.receive_json())["error"]["code"]=="invalid_config"
    assert hass.data[DOMAIN].store.snapshot["revision"]==0

async def test_real_storage_write_failure_is_reported(hass, caplog):
    store=DashboardStore(hass)
    await store.async_save(0,CONFIG)
    with patch("homeassistant.helpers.storage.write_utf8_file_atomic",side_effect=WriteError("disk full")):
        with pytest.raises(OSError):await store.async_save(1,CONFIG)
    assert store.snapshot["revision"]==1
    assert "Error writing config" in caplog.text


@pytest.mark.parametrize("entity", [None, "sensor.chiller"])
async def test_catalog_card_persists_type_and_optional_binding(hass, entity):
    config = deepcopy(CONFIG)
    card = config["views"][0]["cards"][0]
    card.pop("entity")
    card["deviceType"] = "air_cooled_chiller"
    if entity:
        card["entity"] = entity
    store = DashboardStore(hass)
    await store.async_save(0, config)
    reloaded = DashboardStore(hass)
    await reloaded.async_load()
    assert reloaded.snapshot["config"] == config

@pytest.mark.parametrize("device_type", ["", "../thing", "x" * 81, "<script>"])
def test_catalog_type_rejects_invalid_identifier(device_type):
    config = deepcopy(CONFIG)
    config["views"][0]["cards"][0]["deviceType"] = device_type
    with pytest.raises(vol.Invalid):
        validate_config(config)



@pytest.mark.parametrize("device_id", ["", "../device", "<script>", "x" * 129, 123])
def test_home_assistant_device_binding_rejects_invalid_ids(device_id):
    config = deepcopy(CONFIG)
    config["views"][0]["cards"][0]["deviceId"] = device_id
    with pytest.raises(vol.Invalid):
        validate_config(config)


async def test_home_assistant_device_binding_persists_with_primary_entity(hass):
    config = deepcopy(CONFIG)
    config["views"][0]["cards"][0].update(
        deviceType="washing_machine", deviceId="registered-washer-device"
    )
    store = DashboardStore(hass)
    await store.async_save(0, config)
    reloaded = DashboardStore(hass)
    await reloaded.async_load()
    assert reloaded.snapshot["config"] == config
