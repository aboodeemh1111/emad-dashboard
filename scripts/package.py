"""Build deterministic HACS, manual-install and source archives from one release."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import struct
import sys
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
COMPONENT = ROOT / "custom_components/emad_dashboard"
SOURCE_PATHS = [".github", ".gitignore", "custom_components", "frontend", "scripts", "tests", "hacs_tests", "README.md", "CHANGELOG.md", "LICENSE", "NOTICE", "hacs.json", "release.json", "requirements-test.txt", "pytest.ini", "vendor-manifest.json", "releases"]
IGNORED = {"node_modules", "__pycache__", ".pytest_cache", ".git", ".venv", "dist", ".hacs-test-runtime"}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_files() -> list[Path]:
    result = []
    for name in SOURCE_PATHS:
        path = ROOT / name
        if not path.exists():
            raise ValueError(f"Required repository content missing: {name}")
        result.extend(p for p in ([path] if path.is_file() else path.rglob("*")) if p.is_file() and not IGNORED.intersection(p.relative_to(ROOT).parts) and p.suffix != ".pyc")
    return sorted(result)


def validate_release(tag: str | None = None) -> tuple[dict, dict]:
    manifest = json.loads((COMPONENT / "manifest.json").read_text())
    bundle = json.loads((COMPONENT / "frontend/bundle-manifest.json").read_text())
    hacs = json.loads((ROOT / "hacs.json").read_text())
    release = json.loads((ROOT / "release.json").read_text())
    version = manifest["version"]
    if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", version):
        raise ValueError("Integration version must be a semantic version")
    if tag is not None and tag != release["tag_prefix"] + version:
        raise ValueError(f"Release tag {tag!r} does not match version {version}")
    expected = [bundle["version"], json.loads((ROOT / "frontend/package.json").read_text())["version"], json.loads((ROOT / "frontend/package-lock.json").read_text())["version"]]
    const = re.search(r'^VERSION = "([^\"]+)"', (COMPONENT / "const.py").read_text(), re.M)
    if not const or any(value != version for value in [*expected, const[1]]):
        raise ValueError("Integration, bundle, Python and npm versions must match")
    if manifest["domain"] != "emad_dashboard" or bundle["deviceTypes"] != 488 or bundle["systems"] != 30:
        raise ValueError("The complete Emad card catalog must be retained")
    if hacs.get("zip_release") is not True or hacs.get("filename") != release["hacs_asset"] or not hacs.get("hide_default_branch"):
        raise ValueError("HACS must use the versioned, compiled release asset")
    if not all(manifest.get(key) for key in ["codeowners", "documentation", "issue_tracker", "name"]):
        raise ValueError("HACS integration metadata is incomplete")
    if not bundle["selfContained"] or not all(name.startswith("emad-") for name in bundle["customElements"]):
        raise ValueError("The bundle must be self-contained and namespaced")
    entry = COMPONENT / "frontend" / bundle["entrypoint"]
    if entry.parent != COMPONENT / "frontend" or digest(entry) != bundle["sha256"]:
        raise ValueError("Compiled frontend is missing or changed; build it before packaging")
    for face in json.loads((ROOT / "frontend/src/font-faces.json").read_text()):
        if not (COMPONENT / "frontend/fonts" / face["file"]).is_file():
            raise ValueError(f"Missing font: {face['file']}")
    for item in json.loads((ROOT / "vendor-manifest.json").read_text()).values():
        if digest(ROOT / item["vendoredFile"]) != item["vendoredSha256"]:
            raise ValueError(f"Vendored source changed: {item['vendoredFile']}")
    for name, size in [("icon.png", 256), ("icon@2x.png", 512)]:
        data = (COMPONENT / "brand" / name).read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n" or struct.unpack(">II", data[16:24]) != (size, size):
            raise ValueError(f"Invalid local brand asset: {name}")
    if sorted(p.name for p in (ROOT / "custom_components").iterdir() if p.is_dir() and p.name != "__pycache__") != ["emad_dashboard"]:
        raise ValueError("A HACS repository must contain exactly one integration")
    return manifest, bundle


def archive(target: Path, files: list[tuple[Path, str]]) -> dict:
    if any(Path(name).is_absolute() or ".." in Path(name).parts for _, name in files):
        raise ValueError("Unsafe archive path")
    if len({name for _, name in files}) != len(files):
        raise ValueError("Duplicate archive path")
    with ZipFile(target, "w", compression=ZIP_DEFLATED, compresslevel=9) as stream:
        for source, name in sorted(files, key=lambda item: item[1]):
            entry = ZipInfo(name, date_time=(2026, 11, 10, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            stream.writestr(entry, source.read_bytes(), compresslevel=9)
    with ZipFile(target) as stream:
        if stream.testzip() is not None:
            raise ValueError("Archive CRC verification failed")
    return {"file": target.name, "sizeBytes": target.stat().st_size, "sha256": digest(target), "files": len(files)}


def package(output: Path, tag: str | None = None) -> dict:
    manifest, bundle = validate_release(tag)
    output.mkdir(parents=True, exist_ok=True)
    component_files = [p for p in COMPONENT.rglob("*") if p.is_file() and not IGNORED.intersection(p.parts) and p.suffix != ".pyc"]
    hacs_files = [(p, str(p.relative_to(COMPONENT))) for p in component_files]
    manual_files = [(p, str(p.relative_to(ROOT))) for p in component_files] + [(ROOT / name, name) for name in ["README.md", "LICENSE", "NOTICE"]]
    version = manifest["version"]
    result = {"hacs": archive(output / "emad_dashboard.zip", hacs_files), "integration": archive(output / f"emad_dashboard-{version}.zip", manual_files), "source": archive(output / f"emad_dashboard-{version}-source.zip", [(p, "emad-dashboard/" + str(p.relative_to(ROOT))) for p in source_files()]), "bundle": bundle}
    (output / "release-manifest.json").write_text(json.dumps(result, indent=2) + "\n")
    (output / "installed-files.json").write_text(json.dumps({name: digest(p) for p, name in hacs_files}, indent=2) + "\n")
    (output / "SHA256SUMS").write_text("".join(f"{result[key]['sha256']}  {result[key]['file']}\n" for key in ["hacs", "integration", "source"]))
    return result


if __name__ == "__main__":
    print(json.dumps(package(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist", sys.argv[2] if len(sys.argv) > 2 else None), indent=2))
