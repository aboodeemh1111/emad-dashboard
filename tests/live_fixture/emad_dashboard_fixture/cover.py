from homeassistant.components.demo.cover import async_setup_entry as setup_demo
async def async_setup_entry(hass,entry,async_add_entities):
    await setup_demo(hass,entry,async_add_entities)
