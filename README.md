# Emad Dashboard for Home Assistant

<img src="custom_components/emad_dashboard/brand/icon.png" alt="Emad" width="96" height="96">

A standalone **Emad Dashboard** sidebar integration for normal Home Assistant. Keep the standard Overview, Settings and installed device integrations, with the complete Emad control UI alongside them.

**488 device card types · 30 systems · realistic scenes and animations · responsive wall panels · English/Arabic and RTL · collision-aware drag/drop · undo/redo · native device controls.**

## Install through HACS

Requires Home Assistant **2026.8.3+** and HACS **2.0.5+**. Install HACS first using its [official instructions](https://www.hacs.xyz/docs/use/).

1. Open **HACS → ⋮ → Custom repositories**.
2. Add `https://github.com/aboodeemh1111/emad-dashboard` with type **Integration**.
3. Find **Emad Dashboard**, choose **Download**, and restart Home Assistant.
4. Open **Settings → Devices & services → Add integration → Emad Dashboard**, submit, then open **Emad Dashboard** in the sidebar.

This uses HACS custom repositories. Inclusion in the default HACS catalog is a separate process and is not claimed here. No frontend wheel, Lovelace resource, cloud account or Emad Site Controller is needed.

## Update through HACS

When a newer GitHub release is available, choose **Update** for Emad Dashboard in HACS or its Home Assistant update entity. Restart Home Assistant, then reload your wall panels/browser tabs. HACS downloads the compiled release asset; no local build or manual file copying is required.

Your views, card positions, notes and entity/device bindings remain in `.storage/emad_dashboard.dashboard`, outside the integration directory that HACS replaces. Keep the existing Emad Dashboard config entry. Back up Home Assistant before upgrading. Once multiple releases exist, HACS's **Redownload** version selector can select an earlier release; compatibility with the saved layout depends on that release's documented storage schema.

**Migrating from the manual 0.1.0 install:** add this HACS repository and download Emad Dashboard, then restart. The domain, config-entry version and layout storage key are unchanged. Your existing dashboard does not need to be recreated or added twice.

## Connect devices

Add each physical device through its normal Home Assistant integration first. Choose the matching Emad card type, select the registered Home Assistant device or primary entity, and save the dashboard. Related controls/readings come from entities on the same registered device. Unsupported capabilities are unavailable; the integration does not invent device commands.

Unbound cards are marked examples and operate only their local simulations. A catalog type is a UI representation, not a hardware driver or a promise that every device model exposes all controls.

Administrators edit the shared layout. Other authenticated users can view it and operate devices permitted by Home Assistant. Cards use the host's existing authenticated state and service connection. Cameras use Home Assistant's native picture card when available, or its same-origin camera proxy with access to native camera details.

## Wall panels and appearance

Open `/emad-dashboard` in a current browser/WebView. Small screens use a readable flow layout; compact card bodies scroll to keep controls reachable. Emad styling, light/dark themes, English/Arabic, RTL, reduced motion, touch controls, resize, undo/redo, collision-aware dragging and focus mode are retained. Focus mode hides the Emad editing chrome; Home Assistant controls its own sidebar.

## Manual installation

Download `emad_dashboard-<version>.zip` from [Releases](https://github.com/aboodeemh1111/emad-dashboard/releases), extract it into your Home Assistant configuration directory so that `custom_components/emad_dashboard/manifest.json` exists, then restart and add the integration.

`emad_dashboard.zip` is the **HACS asset**: its root contains `manifest.json` and must be extracted into `custom_components/emad_dashboard/` when used manually. The versioned manual archive includes the `custom_components/emad_dashboard/` directory prefix. SHA-256 checksums and the buildable source archive accompany each release.

## Removal and controller compatibility

Delete the config entry under Devices & services, then remove the download through HACS. The sidebar panel and subscriptions are unloaded; saved layouts are retained for reinstall. The normal Home Assistant frontend and device integrations remain in place.

The legacy Emad Site Controller dashboard also claims `/emad-dashboard`. Do not enable both dashboard implementations on one instance. This integration refuses an occupied sidebar path rather than replacing another panel. Its layout store is separate from the controller's store; controller layouts are not silently imported.

## Development and verification

```sh
cd frontend
npm ci --ignore-scripts
npm run typecheck
npm run format:check
npm test
npm run build
cd ..
python -m pip install -r requirements-test.txt
python scripts/fetch-hacs.py .hacs-test-runtime
PYTHONPATH=.hacs-test-runtime python -m pytest -c pytest.ini tests hacs_tests
python scripts/package.py
```

`dist/emad_dashboard.zip` is the HACS release asset. The other ZIPs are the manual installer and complete source. Tests use Home Assistant 2026.8.3 and the checksum-pinned official HACS 2.0.5 installer to exercise first install, the HACS update entity, preservation of stored bindings/layouts, and restoration after a failed download. GitHub responses are substituted in installer tests; no real equipment is operated.

For future releases, run `python scripts/version.py 0.1.2`, update `CHANGELOG.md`, add `releases/0.1.2.md`, rebuild, test, commit the compiled assets, and push tag `v0.1.2`. The release workflow validates the tag against every version declaration, runs the card/backend/HACS tests plus HACS validation and Hassfest, and publishes the compiled archives and checksums after validation succeeds. Stable tags publish normal releases; prerelease tags publish prereleases. Push access to release tags controls who can publish updates. After publication the workflow downloads the real GitHub asset through HACS for both a fresh install and an update. Its manual Run workflow option can reverify an existing tag; matching published checksums are required and existing release assets are kept unchanged.

The native Emad UI is vendored here with original/transformed hashes in `vendor-manifest.json`; installation needs no sibling checkout. `scripts/sync-native.py` is an optional maintainer import tool. Third-party licenses and font notices ship in the integration. Physical devices, camera HLS/audio and specific wall-panel firmware need commissioning on the target installation.
