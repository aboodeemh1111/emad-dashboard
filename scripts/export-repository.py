"""Export only the independent HACS project; never publish the parent BMS repo."""
from pathlib import Path
import importlib.util
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("emad_package", ROOT / "scripts/package.py")
packaging = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packaging)

def export_repository(destination: Path) -> dict:
    destination = destination.resolve()
    if destination == ROOT or destination in ROOT.parents:
        raise ValueError("Export must not overwrite the source checkout")
    if destination.exists() and any(destination.iterdir()):
        raise ValueError("Export destination must be empty")
    packaging.validate_release()
    files = packaging.source_files()
    for source in files:
        target = destination / source.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    return {"repository": json.loads((ROOT / "release.json").read_text())["repository"], "files": len(files), "directory": str(destination), "published": False}

if __name__ == "__main__":
    print(json.dumps(export_repository(Path(sys.argv[1])), indent=2))
