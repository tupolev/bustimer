#!/usr/bin/env python3
"""Build browser-friendly VRS static stop timetables from an official GTFS ZIP.

Output is staged in a temporary folder and only published when every validation
passes. Never labels scheduled times as realtime.
"""
import argparse
import csv
import io
import json
from pathlib import Path
import re
import shutil
import tempfile
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone

DEFAULT_URL = "https://download.vrs.de/gtfs/google_transit_goR.zip"
DAYS = ("monday","tuesday","wednesday","thursday","friday","saturday","sunday")

def rows(z, name):
    if name not in z.namelist():
        return
    with z.open(name) as file:
        yield from csv.DictReader(io.TextIOWrapper(file,encoding="utf-8-sig",newline=""))

def write(path, data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":")),encoding="utf-8")

def build(zip_path, out):
    with zipfile.ZipFile(zip_path) as z:
        missing={"stops.txt","trips.txt","routes.txt","stop_times.txt"}-set(z.namelist())
        if missing:
            raise ValueError("GTFS missing: "+", ".join(sorted(missing)))
        calendar={s["service_id"]:{"from":s["start_date"],"to":s["end_date"],"days":[s.get(d)=="1" for d in DAYS]} for s in rows(z,"calendar.txt")}
        exceptions=defaultdict(dict)
        for s in rows(z,"calendar_dates.txt"):
            exceptions[s["service_id"]][s["date"]]=s["exception_type"]=="1"
        if not calendar and not exceptions:
            raise ValueError("No service calendars found")
        routes={r["route_id"]:r for r in rows(z,"routes.txt")}
        trips={t["trip_id"]:(t["route_id"],t["service_id"],t.get("trip_headsign","")) for t in rows(z,"trips.txt")}
        by_stop=defaultdict(list)
        for s in rows(z,"stop_times.txt"):
            trip=trips.get(s.get("trip_id"))
            if not trip:continue
            rid,service,headsign=trip
            route=routes.get(rid,{})
            when=s.get("departure_time") or s.get("arrival_time") or ""
            try:
                hh,mm,ss=map(int,when.split(":"))
                if mm>59 or ss>59 or hh>47:continue
            except ValueError:continue
            name=route.get("route_short_name") or route.get("route_long_name") or rid
            kind=route.get("route_type","3")
            by_stop[s["stop_id"]].append([hh*60+mm,service,name,s.get("stop_headsign") or headsign,kind])
        index=[]
        filenames=set()
        for s in rows(z,"stops.txt"):
            sid=s["stop_id"]
            if sid not in by_stop:continue
            try:lat,lon=float(s["stop_lat"]),float(s["stop_lon"])
            except (ValueError,KeyError):continue
            if not (49.5<=lat<=52.5 and 5.5<=lon<=9.5):continue
            index.append({"id":sid,"name":s["stop_name"],"lat":lat,"lon":lon})
            safe=re.sub(r"[^A-Za-z0-9_-]","_",sid)
            if safe!=sid:
                # Never silently overwrite colliding sanitized filenames.
                import hashlib
                safe=hashlib.sha256(sid.encode()).hexdigest()[:24]
            if safe in filenames: raise ValueError("Stop filename collision: "+safe)
            filenames.add(safe)
            index[-1]["file"]=safe
            write(out/"stops"/(safe+".json"),sorted(set(tuple(x) for x in by_stop[sid])))
        if len(index)<100:
            raise ValueError("Suspiciously small VRS import: "+str(len(index)))
        if not any((row["from"]<=datetime.now(timezone.utc).strftime("%Y%m%d")<=row["to"]) for row in calendar.values()) and not any(datetime.now(timezone.utc).strftime("%Y%m%d") in ex for ex in exceptions.values()):
            raise ValueError("GTFS has no calendar service for current date")
        metadata={"updated":datetime.now(timezone.utc).isoformat(),"timezone":"Europe/Berlin","source":DEFAULT_URL,"license":"Datenlizenz Deutschland Zero 2.0 — VRS"}
        write(out/"search.json",{**metadata,"stops":index})
        write(out/"services.json",{**metadata,"calendar":calendar,"exceptions":exceptions})
        print("Built",len(index),"VRS stops")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--source",default=DEFAULT_URL)
    parser.add_argument("--out",default="data/vrs")
    args=parser.parse_args()
    with tempfile.TemporaryDirectory() as temp:
        temp=Path(temp)
        source=temp/"vrs.zip"
        if args.source.startswith("https://"):
            request=urllib.request.Request(args.source,headers={"User-Agent":"BusTimer/0.9 (+https://github.com/tupolev/bustimer)"})
            with urllib.request.urlopen(request,timeout=120) as r, source.open("wb") as f:
                shutil.copyfileobj(r,f)
        else:
            shutil.copyfile(args.source,source)
        destination=temp/"compiled"
        build(source,destination)
        target=Path(args.out)
        if target.exists():shutil.rmtree(target)
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copytree(destination,target)

if __name__=="__main__":main()
