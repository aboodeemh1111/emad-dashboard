"""Add the dashboard without credentials, cloud services, or YAML."""

from typing import Any

from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult
import voluptuous as vol

from .const import DOMAIN


class EmadDashboardConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """One dashboard, shared by the Home Assistant instance."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Emad Dashboard", data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))
