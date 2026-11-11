"""Exercise HACS 2.0.5 itself; only GitHub transport/metadata are substituted."""
from copy import deepcopy
from io import BytesIO
import json
from pathlib import Path
from unittest.mock import AsyncMock, ANY
from types import SimpleNamespace
import importlib.util
from zipfile import ZIP_DEFLATED, ZipFile

from awesomeversion import AwesomeVersion
import pytest
from homeassistant.loader import async_get_custom_components
from custom_components.hacs.base import HacsBase
from custom_components.hacs.coordinator import HacsUpdateCoordinator
from custom_components.hacs.enums import HacsCategory
from custom_components.hacs.exceptions import HacsException
from custom_components.hacs.repositories import base as repository_base
from custom_components.hacs.repositories.base import HacsManifest
from custom_components.hacs.repositories.integration import HacsIntegrationRepository
from custom_components.hacs.update import HacsRepositoryUpdateEntity
from custom_components.hacs.utils.validate import HACS_MANIFEST_JSON_SCHEMA
from custom_components.emad_dashboard.layout import DashboardStore

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / "custom_components/emad_dashboard"
VERSION = json.loads((COMPONENT / "manifest.json").read_text())["version"]
LAYOUT = {"version": 1, "views": [{"id": "home", "name": "Living space", "cards": [{"id": "washer", "kind": "device", "deviceType": "washing_machine", "deviceId": "registered-washer", "entity": "sensor.washer_cycle", "x": 0, "y": 0, "w": 384, "h": 720}]}]}


@pytest.fixture(scope="session")
def packaged_asset(tmp_path_factory):
    spec=importlib.util.spec_from_file_location("emad_package",ROOT/"scripts/package.py")
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    destination=tmp_path_factory.mktemp("release-artifacts");module.package(destination)
    return (destination/"emad_dashboard.zip").read_bytes()


def release_bytes(packaged_asset, version=VERSION):
    """A preceding release fixture uses the same proven card payload/schema."""
    output = BytesIO()
    with ZipFile(output, "w", ZIP_DEFLATED) as stream:
        with ZipFile(BytesIO(packaged_asset)) as original:
            for name in original.namelist():
                data=original.read(name)
                if name in ("manifest.json", "frontend/bundle-manifest.json"):
                    doc=json.loads(data);doc["version"]=version;data=json.dumps(doc).encode()
                if name=="const.py":data=data.replace(f'VERSION = "{VERSION}"'.encode(),f'VERSION = "{version}"'.encode())
                stream.writestr(name,data)
    return output.getvalue()


@pytest.fixture
async def repository(hass, monkeypatch, tmp_path, packaged_asset):
    await async_get_custom_components(hass)
    hacs = HacsBase();hacs.hass = hass;hacs.core.config_path = hass.config.path()
    hacs.core.ha_version = AwesomeVersion("2026.8.3");hacs.version = AwesomeVersion("2.0.5")
    hacs.coordinators[HacsCategory.INTEGRATION] = HacsUpdateCoordinator()
    repo = HacsIntegrationRepository(hacs, "aboodeemh1111/emad-dashboard")
    repo.data.domain = "emad_dashboard";repo.data.config_flow = True;repo.data.id = "12345"
    repo.data.releases = True;repo.data.last_version = "v" + VERSION;repo.data.default_branch = "main"
    repo.repository_manifest = HacsManifest.from_dict(HACS_MANIFEST_JSON_SCHEMA(json.loads((ROOT / "hacs.json").read_text())))
    repo.content.path.local = repo.localpath
    # Remote discovery is a separate GitHub-boundary concern. Run the real HACS
    # install, update entity, backup, extraction, cache reload, and restart issue.
    repo.update_repository = AsyncMock()
    response=SimpleNamespace(status=200,read=AsyncMock(return_value=packaged_asset))
    repo.hacs.session=SimpleNamespace(get=AsyncMock(return_value=response))
    original_backup = repository_base.Backup
    monkeypatch.setattr(repository_base, "Backup", lambda **kwargs: original_backup(**kwargs, backup_path=str(tmp_path / "hacs-backup") + "/"))
    return repo


async def test_first_install_uses_hacs_root_archive_and_native_cache_reload(repository):
    repo = repository;repo.data.first_install = True
    await repo.async_download_repository(ref="v" + VERSION)
    installed = Path(repo.localpath)
    assert json.loads((installed / "manifest.json").read_text())["version"] == VERSION
    assert (installed / "frontend/bundle-manifest.json").is_file()
    assert not (installed / "custom_components").exists()
    assert repo.data.installed and repo.display_installed_version == "v" + VERSION
    assert repo.pending_restart is False
    repo.hacs.session.get.assert_awaited_once_with(url=f"https://github.com/aboodeemh1111/emad-dashboard/releases/download/v{VERSION}/emad_dashboard.zip",timeout=ANY,headers=None)


async def seed_previous_install(repo, packaged_asset):
    destination = Path(repo.localpath)
    with ZipFile(BytesIO(release_bytes(packaged_asset,"0.1.0"))) as stream:stream.extractall(destination)
    (destination / "frontend/emad-dashboard.obsolete.js").write_text("obsolete cached bundle")
    repo.data.installed = True;repo.data.installed_version = "v0.1.0"
    store = DashboardStore(repo.hacs.hass)
    await store.async_save(0, deepcopy(LAYOUT))
    unrelated = Path(repo.hacs.core.config_path) / "custom_components/unrelated/manifest.json"
    unrelated.parent.mkdir(parents=True, exist_ok=True);unrelated.write_text('{"domain":"unrelated"}')
    return store, unrelated


async def test_hacs_update_entity_preserves_layout_bindings_and_other_integrations(repository,packaged_asset):
    repo = repository;store, unrelated = await seed_previous_install(repo,packaged_asset)
    update = HacsRepositoryUpdateEntity(repo.hacs, repo)
    assert update.installed_version == "v0.1.0" and update.latest_version == "v" + VERSION
    assert repo.pending_update
    await update.async_install(version=None, backup=False)
    assert update.installed_version == "v" + VERSION and not repo.pending_update
    assert repo.pending_restart
    assert not (Path(repo.localpath) / "frontend/emad-dashboard.obsolete.js").exists()
    assert unrelated.read_text() == '{"domain":"unrelated"}'
    reloaded = DashboardStore(repo.hacs.hass);await reloaded.async_load()
    assert reloaded.snapshot == {"revision": 1, "config": LAYOUT}
    assert store.snapshot == reloaded.snapshot
    bundle = json.loads((Path(repo.localpath) / "frontend/bundle-manifest.json").read_text())
    assert bundle["deviceTypes"] == 488 and bundle["systems"] == 30


async def test_failed_download_restores_previous_install_and_layout(repository,packaged_asset):
    repo = repository;await seed_previous_install(repo,packaged_asset)
    before = (Path(repo.localpath) / "manifest.json").read_bytes()
    repo.hacs.session.get.return_value.status=404
    with pytest.raises(HacsException):await repo.async_download_repository(ref="v" + VERSION)
    assert (Path(repo.localpath) / "manifest.json").read_bytes() == before
    assert repo.display_installed_version == "v0.1.0"
    reloaded = DashboardStore(repo.hacs.hass);await reloaded.async_load()
    assert reloaded.snapshot["config"] == LAYOUT


async def test_hacs_blocks_unsupported_home_assistant_versions(repository):
    repo = repository;repo.hacs.core.ha_version = AwesomeVersion("2025.1.0")
    with pytest.raises(HacsException, match="requires Home Assistant"):
        await repo.async_download_repository(ref="v" + VERSION)
    repo.hacs.session.get.assert_not_awaited()
