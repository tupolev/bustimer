#!/usr/bin/env python3
"""Build a small static, stop-centric EMT Málaga timetable for GitHub Pages.

GTFS copyright: EMT Málaga / Ayuntamiento de Málaga; source licensing and
attribution MUST be retained. No credentials are required.
"""
import csv
import io
import json
import os
from pathlib import Path
import sys
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone

URL = "https://gtfs.emtmalaga.es/GTFS/google_transit.zip"
OUT = Path("data/malaga")
OUT.mkdir(parents=True, exist_ok=True)

def get_zip():
    with urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent":"BusTimer/0.3 (+https://github.com/tupolev/bustimer/issues)"}), timeout=100) as r:
        return zipfile.ZipFile(io.BytesIO(r.read()))

def load(z, name):
    with z.open(name) as f:
        return list(csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig", newline="")))

def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",",":")), encoding="utf8")

def main():
    z=get_zip()
    names=set(z.namelist())
    for n in ("stops.txt","routes.txt","trips.txt","stop_times.txt","calendar.txt"):
        if n not in names:
            raise ValueError("GTFS is missing "+n)
    stops=load(z,"stops.txt")
    routes={r["route_id"]:r for r in load(z,"routes.txt")}
    trips={r["trip_id"]:r for r in load(z,"trips.txt")}
    calendar={r["service_id"]:{ "from":r["start_date"],"to":r["end_date"],"days":[r[x]=="1" for x in ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]]} for r in load(z,"calendar.txt")}
    exceptions=defaultdict(dict)
    if "calendar_dates.txt" in names:
        for e in load(z,"calendar_dates.txt"):
            exceptions[e["service_id"]][e["date"]]=int(e["exception_type"])==1
    by_stop=defaultdict(list)
    for st in load(z,"stop_times.txt"):
        trip=trips.get(st.get("trip_id"))
        if not trip: continue
        route=routes.get(trip.get("route_id"),{})
        if route.get("route_type") not in ("3","700","701","702","704","705","706","707","708","709","710","711","712","713","714","715","716","717","800","900") and not route.get("route_type","").startswith("7"):
            continue
        time=st.get("departure_time") or st.get("arrival_time")
        if not time:continue
        try:
            hh,mm,ss=map(int,time.split(":"))
            minute=hh*60+mm
        except Exception: continue
        if minute>48*60:continue
        by_stop[st["stop_id"]].append([minute,trip["service_id"],route.get("route_short_name") or route.get("route_long_name") or trip["route_id"],trip.get("trip_headsign",""),route.get("route_type","3")])
    index=[]
    for s in stops:
        sid=s["stop_id"]
        if sid not in by_stop:continue
        index.append({"id":sid,"name":s["stop_name"],"lat":s.get("stop_lat"),"lon":s.get("stop_lon")})
        records=sorted(set(tuple(x) for x in by_stop[sid]))
        write(OUT/"stops"/(sid+".json"),records)
    write(OUT/"index.json",{"updated":datetime.now(timezone.utc).isoformat(),"source":URL,"license":"CC BY-SA 4.0 — Ayuntamiento de Málaga / EMT Málaga","stops":index,"calendar":calendar,"exceptions":exceptions})
    print("Exported",len(index),"stops and",sum(map(len,by_stop.values())),"timetable entries")

if __name__=="__main__": main()
