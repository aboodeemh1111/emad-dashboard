from homeassistant.components.sensor import SensorEntity
from .base import Washer
class Cycle(Washer,SensorEntity):
    _attr_unique_id="qa_washer_cycle"
    _attr_name="Cycle"
    _attr_native_value="idle"
async def async_setup_entry(hass,entry,add):add([Cycle()])
