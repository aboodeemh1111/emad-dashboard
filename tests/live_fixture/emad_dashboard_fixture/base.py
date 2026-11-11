from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity
class Washer(Entity):
    _attr_should_poll=False
    _attr_has_entity_name=True
    _attr_device_info=DeviceInfo(identifiers={("emad_dashboard_fixture","washer")},name="Verification washer",manufacturer="Emad QA",model="Simulation")
