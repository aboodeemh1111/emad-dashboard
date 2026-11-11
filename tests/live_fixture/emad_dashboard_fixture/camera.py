from homeassistant.components.demo.camera import DemoCameraWithoutStream
async def async_setup_entry(hass,entry,add):
    add([DemoCameraWithoutStream("Verification camera","image/png")])
