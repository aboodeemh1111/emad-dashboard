from homeassistant.components.button import ButtonEntity
from .base import Washer
class Start(Washer,ButtonEntity):
    _attr_unique_id="qa_washer_start"
    _attr_name="Start"
    async def async_press(self):
        self.hass.states.async_set("sensor.verification_washer_cycle","running")
async def async_setup_entry(hass,entry,add):add([Start()])
