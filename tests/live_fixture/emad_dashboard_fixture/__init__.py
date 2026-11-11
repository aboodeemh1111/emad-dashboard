from homeassistant.config_entries import SOURCE_IMPORT
from homeassistant.const import Platform
PLATFORMS=[Platform.LIGHT,Platform.CLIMATE,Platform.COVER,Platform.FAN,Platform.SENSOR,Platform.NUMBER,Platform.SELECT,Platform.BUTTON,Platform.CAMERA]
async def async_setup(hass,config):
    hass.async_create_task(hass.config_entries.flow.async_init("emad_dashboard_fixture",context={"source":SOURCE_IMPORT},data={}))
    return True
async def async_setup_entry(hass,entry):
    await hass.config_entries.async_forward_entry_setups(entry,PLATFORMS)
    return True
