#!/usr/bin/env python3
"""Bounded-memory GTFS inspection for the Netherlands; never publishes incomplete timetables."""
import argparse
import csv
import io
import json
import zipfile
from collections import Counter
from pathlib import Path
from datetime import date

REQUIRED={"stops.txt","routes.txt","trips.txt","stop_times.txt"}
MAX_UNCOMPRESSED=5_000_000_000

def records(archive, name):
    with archive.open(name) as stream:
        yield from csv.DictReader(io.TextIOWrapper(stream, encoding="utf-8-sig", newline=""))

def validate(path):
    with zipfile.ZipFile(path) as archive:
        members={item.filename:item for item in archive.infolist()}
        missing=REQUIRED-members.keys()
        if missing: raise ValueError("Missing GTFS members: "+", ".join(sorted(missing)))
        for item in members.values():
            if item.file_size>MAX_UNCOMPRESSED:
                raise ValueError("Oversized member: "+item.filename)
        if sum(item.file_size for item in members.values())>8_000_000_000:
            raise ValueError("GTFS uncompressed size exceeded")
        modes=Counter()
        for row in records(archive,"routes.txt"):
            modes[row.get("route_type","unknown")]+=1
        stops=0;outside=0
        for row in records(archive,"stops.txt"):
            try: lat,lon=float(row["stop_lat"]),float(row["stop_lon"])
            except (ValueError,KeyError): continue
            if 50.73<=lat<=53.75 and 3.25<=lon<=7.3:stops+=1
            else:outside+=1
        if stops<1000:raise ValueError("Unexpectedly small Netherlands stop index")
        services=0;relevant=0
        today=date.today().strftime("%Y%m%d")
        if "calendar_dates.txt" in members:
            for row in records(archive,"calendar_dates.txt"):
                services+=1
                if row.get("date","")>=today: relevant+=1
        if "calendar.txt" in members:
            for row in records(archive,"calendar.txt"):
                services+=1
                if row.get("end_date","")>=today: relevant+=1
        if not relevant:raise ValueError("No current/future service calendars")
        return {"stops_in_bounds":stops,"stops_outside":outside,"calendar_date_rows":services,
                "future_calendar_date_rows":relevant,"route_modes":dict(modes),
                "uncompressed_bytes":sum(i.file_size for i in members.values()),
                "status":"inspected-only","timetable_published":False}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("feed",type=Path)
    parser.add_argument("--report",type=Path)
    args=parser.parse_args()
    report=validate(args.feed)
    output=json.dumps(report,indent=2,sort_keys=True)
    print(output)
    if args.report:
        args.report.parent.mkdir(parents=True,exist_ok=True)
        args.report.write_text(output+"\n",encoding="utf-8")
if __name__=="__main__":main()
