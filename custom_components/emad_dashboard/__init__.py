"""Standalone Emad dashboard, served as a normal Home Assistant custom panel."""

from dataclasses import dataclass, field
import json
import logging
from pathlib import Path
from typing import Callable

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.typing import ConfigType
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN, PANEL_PATH, STATIC_PATH, VERSION
from .layout import DashboardStore, async_register_commands

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

_LOGGER = logging.getLogger(__name__)
_FRONTEND = Path(__file__).parent / "frontend"


@dataclass
class DashboardRuntime:
    """Keep the API registered once and stop subscriptions when unloaded."""

    store: DashboardStore
    active: bool = False
    unsubscribers: set[Callable[[], None]] = field(default_factory=set)


def _read_bundle() -> str:
    manifest = json.loads((_FRONTEND / "bundle-manifest.json").read_text())
    filename = manifest["entrypoint"]
    if (
        not isinstance(filename, str)
        or Path(filename).name != filename
        or not filename.startswith("emad-dashboard.")
        or not filename.endswith(".js")
        or not (_FRONTEND / filename).is_file()
    ):
        raise ValueError("Invalid or missing dashboard bundle")
    return filename


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Initialize local storage and API; do not replace frontend resources."""
    store = DashboardStore(hass)
    try:
        await store.async_load()
    except (ValueError, OSError) as err:
        _LOGGER.error("Could not load Emad dashboard storage: %s", err)
        return False
    hass.data[DOMAIN] = DashboardRuntime(store)
    async_register_commands(hass)
    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_PATH, str(_FRONTEND), cache_headers=True)]
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Add a sidebar entry using the standard custom-panel API."""
    try:
        bundle = await hass.async_add_executor_job(_read_bundle)
    except (OSError, ValueError, KeyError, TypeError) as err:
        raise ConfigEntryNotReady("Emad dashboard assets are missing or invalid") from err
    if PANEL_PATH in hass.data.get(frontend.DATA_PANELS, {}):
        raise ConfigEntryNotReady("The emad-dashboard sidebar path is already in use")
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="emad-dashboard-panel",
        sidebar_title="Emad Dashboard",
        sidebar_icon="mdi:view-dashboard-outline",
        module_url=f"{STATIC_PATH}/{bundle}",
        require_admin=False,
        embed_iframe=False,
        handle_safe_area=True,
        config_panel_domain=DOMAIN,
        config={"integration_version": VERSION},
    )
    runtime: DashboardRuntime = hass.data[DOMAIN]
    runtime.active = True
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the panel and listeners while preserving saved layouts."""
    runtime: DashboardRuntime = hass.data[DOMAIN]
    runtime.active = False
    for unsubscribe in tuple(runtime.unsubscribers):
        unsubscribe()
    frontend.async_remove_panel(hass, PANEL_PATH)
    return True
