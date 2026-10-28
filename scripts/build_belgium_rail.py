#!/usr/bin/env python3
"""Stage publicly accessible SNCB/NMBS GTFS, preserving original stop and headsign labels."""
import argparse,gzip,shutil,tempfile,urllib.request
from pathlib import Path
from build_vrs import build

DEFAULT_SOURCE="https://gtfs.irail.be/nmbs/gtfs/latest.zip"
LICENSE="CC BY 4.0 — Source: NMBS-SNCB - Open Data (see feed_info.txt); https://data.belgianmobility.io/en/terms.html"
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--source",default=DEFAULT_SOURCE)
    p.add_argument("--out",default="data/belgium-rail")
    args=p.parse_args()
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp);archive=root/"sncb.zip"
        if args.source.startswith("https://"):
            req=urllib.request.Request(args.source,headers={"User-Agent":"BusTimer GTFS (+https://github.com/tupolev/bustimer)"})
            with urllib.request.urlopen(req,timeout=150) as response,archive.open("wb") as dest:shutil.copyfileobj(response,dest)
        else:shutil.copyfile(args.source,archive)
        compiled=root/"compiled"
        build(archive,compiled,bounds=(49.45,51.62,2.45,6.5),source=args.source,license=LICENSE,timezone_name="Europe/Brussels",min_stops=100)
        # SNCB's service exceptions can exceed GitHub's 100 MB per-file limit.
        # Store as one gzip asset instead of an oversized JSON Git blob.
        services=compiled/"services.json"
        compressed=compiled/"services.json.gz"
        with services.open("rb") as src, gzip.open(compressed,"wb",compresslevel=9) as dst:
            shutil.copyfileobj(src,dst)
        if compressed.stat().st_size>=95_000_000:
            raise ValueError("Compressed SNCB services still too large for GitHub")
        services.unlink()
        target=Path(args.out)
        if target.exists():shutil.rmtree(target)
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copytree(compiled,target)
if __name__=="__main__":main()
