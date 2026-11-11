from homeassistant.config_entries import ConfigFlow
class FixtureFlow(ConfigFlow,domain="emad_dashboard_fixture"):
    VERSION=1
    async def async_step_import(self,user_input):
        await self.async_set_unique_id("fixture")
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title="Simulated devices (verification only)",data={})
