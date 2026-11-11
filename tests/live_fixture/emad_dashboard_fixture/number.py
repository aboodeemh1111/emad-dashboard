from homeassistant.components.number import NumberEntity
from .base import Washer
class Temperature(Washer,NumberEntity):
    _attr_unique_id="qa_washer_temperature"
    _attr_name="Temperature"
    _attr_native_value=40
    _attr_native_min_value=20
    _attr_native_max_value=90
    _attr_native_step=10
    _attr_native_unit_of_measurement="°C"
    async def async_set_native_value(self,value):
        self._attr_native_value=value
        self.async_write_ha_state()
async def async_setup_entry(hass,entry,add):add([Temperature()])
