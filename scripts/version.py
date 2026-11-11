"""Update all release version declarations, then rebuild before tagging."""
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
def set_version(version: str) -> None:
    if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", version):
        raise ValueError("Expected a semantic version, without a v prefix")
    for name in ["custom_components/emad_dashboard/manifest.json", "frontend/package.json", "frontend/package-lock.json"]:
        path = ROOT / name
        data = json.loads(path.read_text());data["version"] = version
        if "packages" in data:data["packages"][""]["version"] = version
        path.write_text(json.dumps(data, indent=2) + "\n")
    path = ROOT / "custom_components/emad_dashboard/const.py"
    path.write_text(re.sub(r'^VERSION = "[^\"]+"', f'VERSION = "{version}"', path.read_text(), flags=re.M))
    print(f"Set {version}. Rebuild the frontend, add release notes, run checks, then tag v{version}.")
if __name__ == "__main__":set_version(sys.argv[1])
