from homeassistant.components.select import SelectEntity
from .base import Washer
class Program(Washer,SelectEntity):
    _attr_unique_id="qa_washer_program"
    _attr_name="Program"
    _attr_current_option="Cotton"
    _attr_options=["Cotton","Eco","Delicate"]
    async def async_select_option(self,option):
        self._attr_current_option=option
        self.async_write_ha_state()
async def async_setup_entry(hass,entry,add):add([Program()])
