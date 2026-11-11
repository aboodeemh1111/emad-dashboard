from homeassistant.components.demo.climate import async_setup_entry as setup_demo
async def async_setup_entry(hass,entry,async_add_entities):
    await setup_demo(hass,entry,async_add_entities)
