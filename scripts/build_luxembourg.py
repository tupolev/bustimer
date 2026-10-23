#!/usr/bin/env python3
"""Stage Luxembourg's official national GTFS for BusTimer (no credentials).

Uses the public data.public.lu catalog API to discover the latest GTFS ZIP.
The output stays disabled in the app until independently validated.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import tempfile
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from build_vrs import build

DATASET="https://data.public.lu/api/1/datasets/horaires-et-arrets-des-transport-publics-gtfs/"
PUBLISHER="Administration des transports publics — Luxembourg"
LICENSE="CC BY 4.0 — "+PUBLISHER

def newest_feed(resources):
    options=[r for r in resources
        if str(r.get("title") or r.get("filename") or "").lower().endswith(".zip")
        and str(r.get("url") or "").startswith("https://")
        and "gtfs" in str(r.get("title") or r.get("filename") or "").lower()]
    if not options:raise ValueError("No GTFS ZIP in official catalog")
    # Use data publication timestamps, not lexical file names.
    result=max(options,key=lambda r:r.get("last_modified") or r.get("modified") or r.get("created_at") or "")
    url=result["url"]
    if urlparse(url).hostname not in ("download.data.public.lu","data.public.lu"):
        raise ValueError("Unexpected download host")
    return url

def load_catalog():
    with urlopen(Request(DATASET,headers={"User-Agent":"BusTimer/GTFS (+https://github.com/tupolev/bustimer)"}),timeout=40) as r:
        data=json.load(r)
    return newest_feed(data["resources"])

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--source",help="Override official feed URL (or local ZIP fixture)")
    parser.add_argument("--out",default="data/luxembourg")
    args=parser.parse_args()
    url=args.source or load_catalog()
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp)
        archive=root/"feed.zip"
        if url.startswith("https://"):
            with urlopen(Request(url,headers={"User-Agent":"BusTimer/GTFS (+https://github.com/tupolev/bustimer)"}),timeout=120) as r, archive.open("wb") as dest:
                shutil.copyfileobj(r,dest)
        else:
            shutil.copyfile(url,archive)
        compiled=root/"compiled"
        build(archive,compiled,bounds=(49.35,50.25,5.6,6.65),source=url,license=LICENSE,timezone_name="Europe/Luxembourg",min_stops=100)
        target=Path(args.out)
        if target.exists():shutil.rmtree(target)
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copytree(compiled,target)
    print("Official Luxembourg GTFS staged, not enabled in app.")

if __name__=="__main__":main()
