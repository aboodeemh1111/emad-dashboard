"""Stock frontend coexistence, installation and unload lifecycle."""
from unittest.mock import patch
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from homeassistant.components import frontend
from homeassistant.config_entries import SOURCE_USER, ConfigEntryState
from custom_components.emad_dashboard.const import DOMAIN, PANEL_PATH, STATIC_PATH
from custom_components.emad_dashboard import _read_bundle

async def installed(hass):
    entry=MockConfigEntry(domain=DOMAIN,unique_id=DOMAIN,data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry

async def test_user_flow_and_single_instance(hass):
    form=await hass.config_entries.flow.async_init(DOMAIN,context={"source":SOURCE_USER})
    assert form["type"]=="form" and form["step_id"]=="user"
    result=await hass.config_entries.flow.async_configure(form["flow_id"],{})
    assert result["type"]=="create_entry" and result["data"]=={}
    await hass.async_block_till_done()
    duplicate=await hass.config_entries.flow.async_init(DOMAIN,context={"source":SOURCE_USER})
    assert duplicate["type"]=="abort" and duplicate["reason"]=="single_instance_allowed"

async def test_sidebar_preserves_standard_panels(hass):
    await installed(hass)
    panels=hass.data[frontend.DATA_PANELS]
    assert "lovelace" in panels and "config" in panels
    panel=panels[PANEL_PATH].to_response()
    assert panel["component_name"]=="custom" and panel["require_admin"] is False
    custom=panel["config"]["_panel_custom"]
    assert custom["name"]=="emad-dashboard-panel"
    assert custom["module_url"].startswith(STATIC_PATH+"/emad-dashboard.")
    assert custom.get("embed_iframe") is False
    assert not any("emad" in str(value) for key,value in panels.items() if key!=PANEL_PATH)

async def test_unload_closes_subscriptions_and_disables_api(hass,hass_ws_client):
    entry=await installed(hass)
    client=await hass_ws_client(hass)
    await client.send_json({"id":1,"type":"emad_dashboard/dashboard/subscribe"})
    assert (await client.receive_json())["success"]
    assert (await client.receive_json())["event"]["revision"]==0
    runtime=hass.data[DOMAIN]
    assert len(runtime.unsubscribers)==1
    assert await hass.config_entries.async_unload(entry.entry_id)
    assert not runtime.active and not runtime.unsubscribers
    assert PANEL_PATH not in hass.data[frontend.DATA_PANELS]
    assert "lovelace" in hass.data[frontend.DATA_PANELS]
    await client.send_json({"id":2,"type":"emad_dashboard/dashboard/get"})
    assert (await client.receive_json())["error"]["code"]=="integration_not_loaded"
    assert await hass.config_entries.async_setup(entry.entry_id)
    assert runtime.active

async def test_unsubscribe_releases_runtime_listener(hass,hass_ws_client):
    await installed(hass)
    client=await hass_ws_client(hass)
    await client.send_json({"id":1,"type":"emad_dashboard/dashboard/subscribe"})
    await client.receive_json();await client.receive_json()
    await client.send_json({"id":2,"type":"unsubscribe_events","subscription":1})
    assert (await client.receive_json())["success"]
    assert not hass.data[DOMAIN].unsubscribers

async def test_existing_sidebar_path_is_not_overwritten(hass):
    entry=await installed(hass)
    assert await hass.config_entries.async_unload(entry.entry_id)
    frontend.async_register_built_in_panel(hass,"lovelace",frontend_url_path=PANEL_PATH,sidebar_title="Other panel")
    await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state==ConfigEntryState.SETUP_RETRY
    assert hass.data[frontend.DATA_PANELS][PANEL_PATH].sidebar_title=="Other panel"

async def test_missing_bundle_does_not_replace_the_frontend(hass):
    with patch("custom_components.emad_dashboard._read_bundle",side_effect=FileNotFoundError):
        entry=MockConfigEntry(domain=DOMAIN,unique_id=DOMAIN,data={});entry.add_to_hass(hass)
        await hass.config_entries.async_setup(entry.entry_id)
    assert entry.state==ConfigEntryState.SETUP_RETRY
    assert PANEL_PATH not in hass.data[frontend.DATA_PANELS]
    assert "lovelace" in hass.data[frontend.DATA_PANELS]

def test_bundle_manifest_cannot_escape_static_directory(tmp_path):
    import json
    (tmp_path/"bundle-manifest.json").write_text(json.dumps({"entrypoint":"../evil.js"}))
    with patch("custom_components.emad_dashboard._FRONTEND",tmp_path),pytest.raises(ValueError):
        _read_bundle()

async def test_listener_cleanup_is_idempotent_after_panel_unload(hass,hass_ws_client,caplog):
    entry=await installed(hass)
    client=await hass_ws_client(hass)
    await client.send_json({"id":1,"type":"emad_dashboard/dashboard/subscribe"})
    await client.receive_json();await client.receive_json()
    assert await hass.config_entries.async_unload(entry.entry_id)
    await client.send_json({"id":2,"type":"unsubscribe_events","subscription":1})
    assert (await client.receive_json())["success"]
    assert "Unable to remove unknown dispatcher" not in caplog.text
    assert not hass.data[DOMAIN].unsubscribers
