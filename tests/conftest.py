"""Enable only the standalone custom component in the standard HA test harness."""
import pytest
@pytest.fixture(autouse=True)
def custom_integrations_enabled(enable_custom_integrations):
    pass
