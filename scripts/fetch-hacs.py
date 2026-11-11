"""Fetch the official, checksum-pinned HACS installer used by integration tests."""
import hashlib
from io import BytesIO
from pathlib import Path
import sys
from urllib.request import urlopen
from zipfile import ZipFile

VERSION = "2.0.5"
SHA256 = "97be6b824a4f38e683728cc6dd72367f6b8bad0a43428b1b3b987a3087adf413"
if __name__ == "__main__":
    root = Path(sys.argv[1]).resolve()
    data = urlopen(f"https://github.com/hacs/integration/releases/download/{VERSION}/hacs.zip", timeout=60).read()
    if hashlib.sha256(data).hexdigest() != SHA256:raise ValueError("Official HACS release checksum changed")
    with ZipFile(BytesIO(data)) as stream:
        if any(Path(name).is_absolute() or ".." in Path(name).parts for name in stream.namelist()):raise ValueError("Unsafe archive path")
        stream.extractall(root / "custom_components/hacs")
    print(f"Verified HACS {VERSION} in {root}")
