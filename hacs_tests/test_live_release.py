"""Verify the published GitHub artifact with the actual HACS download/install path.

Opt in after publication with EMAD_LIVE_HACS_RELEASE=1. No GitHub account is
required for public downloads. The optional CI token is used only for metadata.
"""
from copy import deepcopy
import hashlib
from io import BytesIO
import json
import os
from pathlib import Path
from zipfile import ZipFile

import aiohttp
import pytest
from custom_components.hacs.repositories.base import HacsManifest
from custom_components.hacs.update import HacsRepositoryUpdateEntity
from custom_components.hacs.utils.validate import HACS_MANIFEST_JSON_SCHEMA
from custom_components.emad_dashboard.layout import DashboardStore

from .test_install_update import LAYOUT, VERSION, packaged_asset, repository, seed_previous_install

pytestmark = pytest.mark.skipif(os.environ.get("EMAD_LIVE_HACS_RELEASE") != "1", reason="Public release test runs only after publication")
REPOSITORY = "aboodeemh1111/emad-dashboard"


@pytest.mark.parametrize("existing_install", [False, True], ids=["fresh-install", "update-from-0.1.0"])
async def test_published_release_installs_through_hacs(repository, packaged_asset, existing_install):
    repo = repository
    if existing_install:
        await seed_previous_install(repo, packaged_asset)
    else:
        repo.data.first_install = True
    async with aiohttp.ClientSession() as session:
        headers = {"Accept": "application/vnd.github+json", "User-Agent": "emad-dashboard-release-verification"}
        if token := os.environ.get("GITHUB_TOKEN"):
            headers["Authorization"] = "Bearer " + token
        async with session.get(f"https://api.github.com/repos/{REPOSITORY}/releases/tags/v{VERSION}", headers=headers) as response:
            assert response.status == 200
            release = await response.json()
        assert release["tag_name"] == "v" + VERSION and not release["draft"]
        assets = {asset["name"]: asset for asset in release["assets"]}
        assert "emad_dashboard.zip" in assets and "release-manifest.json" in assets
        async with session.get(assets["release-manifest.json"]["browser_download_url"]) as response:
            assert response.status == 200
            manifest = json.loads(await response.read())
        async with session.get(f"https://raw.githubusercontent.com/{REPOSITORY}/v{VERSION}/hacs.json") as response:
            assert response.status == 200
            repo.repository_manifest = HacsManifest.from_dict(HACS_MANIFEST_JSON_SCHEMA(json.loads(await response.read())))
        repo.data.last_version = release["tag_name"]
        repo.hacs.session = session
        real_download = repo.hacs.async_download_file
        downloaded = []
        async def audited_download(url, **kwargs):
            payload = await real_download(url, **kwargs)
            assert payload is not None and hashlib.sha256(payload).hexdigest() == manifest["hacs"]["sha256"]
            downloaded.append(payload)
            return payload
        repo.hacs.async_download_file = audited_download
        update = HacsRepositoryUpdateEntity(repo.hacs, repo)
        if existing_install:
            assert update.installed_version == "v0.1.0" and repo.pending_update
        await update.async_install(version=None, backup=False)
        assert update.installed_version == release["tag_name"] and not repo.pending_update
        assert len(downloaded) == 1
        with ZipFile(BytesIO(downloaded[0])) as archive:
            assert archive.testzip() is None
            for name in archive.namelist():
                assert (Path(repo.localpath) / name).read_bytes() == archive.read(name)
        assert json.loads((Path(repo.localpath) / "manifest.json").read_text())["version"] == VERSION
        bundle = json.loads((Path(repo.localpath) / "frontend/bundle-manifest.json").read_text())
        assert bundle["deviceTypes"] == 488 and bundle["systems"] == 30
        assert hashlib.sha256((Path(repo.localpath) / "frontend" / bundle["entrypoint"]).read_bytes()).hexdigest() == manifest["bundle"]["sha256"]
        if existing_install:
            store = DashboardStore(repo.hacs.hass);await store.async_load()
            assert store.snapshot == {"revision": 1, "config": deepcopy(LAYOUT)}
            assert repo.pending_restart
            assert not (Path(repo.localpath) / "frontend/emad-dashboard.obsolete.js").exists()
