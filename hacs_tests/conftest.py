"""The official HACS package is supplied by scripts/fetch-hacs.py and PYTHONPATH."""
import pytest

@pytest.fixture(autouse=True)
def custom_integrations_enabled(enable_custom_integrations):
    pass

@pytest.fixture
def hass_storage():
    # Use real atomic storage files, not the harness's in-memory store.
    yield {}

@pytest.fixture
def hass_config_dir(tmp_path):
    return str(tmp_path / "ha-config")
