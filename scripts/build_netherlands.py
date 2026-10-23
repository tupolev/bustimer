#!/usr/bin/env python3
"""Streaming, SQLite-spooled national GTFS compiler; staged output only."""
import argparse, csv, io, json, hashlib, sqlite3, tempfile, zipfile, shutil
from pathlib import Path
from datetime import date

def rows(archive,name):
    if name not in archive.namelist(): return
    with archive.open(name) as file:
        yield from csv.DictReader(io.TextIOWrapper(file,encoding="utf-8-sig",newline=""))

def dump(path,object):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(object,ensure_ascii=False,separators=(",",":")),encoding="utf-8")

def build(feed,out,min_stops=1000):
    with tempfile.TemporaryDirectory() as tmp:
        db=sqlite3.connect(str(Path(tmp)/"gtfs.db"))
        db.execute("PRAGMA journal_mode=OFF")
        db.execute("CREATE TABLE trips (id TEXT PRIMARY KEY, route TEXT, service TEXT, direction TEXT)")
        db.execute("CREATE TABLE stops (id TEXT PRIMARY KEY, name TEXT, lat REAL, lon REAL, file TEXT)")
        db.execute("CREATE TABLE times (stop TEXT, minute INTEGER, service TEXT, line TEXT, direction TEXT, type TEXT)")
        with zipfile.ZipFile(feed) as z:
            files=set(z.namelist())
            if not {"stops.txt","routes.txt","trips.txt","stop_times.txt"}.issubset(files):
                raise ValueError("Incomplete GTFS archive")
            calendar={r["service_id"]:{"from":r["start_date"],"to":r["end_date"],"days":[r.get(d)=="1" for d in ("monday","tuesday","wednesday","thursday","friday","saturday","sunday")]} for r in rows(z,"calendar.txt")}
            exceptions={}
            for r in rows(z,"calendar_dates.txt"):
                exceptions.setdefault(r["service_id"],{})[r["date"]]=r["exception_type"]=="1"
            if not (calendar or exceptions):raise ValueError("No GTFS service calendars")
            routes={r["route_id"]:(r.get("route_short_name") or r.get("route_long_name") or r["route_id"],r.get("route_type","3")) for r in rows(z,"routes.txt")}
            batch=[]
            for r in rows(z,"trips.txt"):
                batch.append((r["trip_id"],r["route_id"],r["service_id"],r.get("trip_headsign","")))
                if len(batch)>=20000:db.executemany("INSERT OR REPLACE INTO trips VALUES(?,?,?,?)",batch);batch=[]
            if batch:db.executemany("INSERT OR REPLACE INTO trips VALUES(?,?,?,?)",batch)
            count=0;batch=[];seen=set()
            for r in rows(z,"stops.txt"):
                try:lat,lon=float(r["stop_lat"]),float(r["stop_lon"])
                except (ValueError,KeyError):continue
                if not (50.73<=lat<=53.75 and 3.25<=lon<=7.3):continue
                sid=r["stop_id"];name=r["stop_name"]
                namehash=hashlib.sha256(sid.encode()).hexdigest()[:24]
                if namehash in seen:raise ValueError("Filename collision")
                seen.add(namehash);count+=1
                batch.append((sid,name,lat,lon,namehash))
                if len(batch)>=10000:db.executemany("INSERT OR REPLACE INTO stops VALUES(?,?,?,?,?)",batch);batch=[]
            if batch:db.executemany("INSERT OR REPLACE INTO stops VALUES(?,?,?,?,?)",batch)
            if count<min_stops:raise ValueError("Not enough Netherlands stops")
            db.commit()
            # Stream the huge stop_times file; join trip metadata against indexed SQLite rows.
            batch=[]
            gettrip=db.cursor(); getstop=db.cursor()
            for r in rows(z,"stop_times.txt"):
                sid=r.get("stop_id")
                if not getstop.execute("SELECT 1 FROM stops WHERE id=?",(sid,)).fetchone():continue
                trip=gettrip.execute("SELECT route,service,direction FROM trips WHERE id=?",(r.get("trip_id"),)).fetchone()
                if not trip:continue
                line,service,direction=trip
                if line not in routes:continue
                raw=r.get("departure_time") or r.get("arrival_time") or ""
                try:h,m,sec=(int(x) for x in raw.split(":"))
                except ValueError:continue
                if not(0<=h<=47 and 0<=m<=59 and 0<=sec<=59):continue
                title,kind=routes[line]
                batch.append((sid,h*60+m,service,title,r.get("stop_headsign") or direction,kind))
                if len(batch)>=10000:db.executemany("INSERT INTO times VALUES(?,?,?,?,?,?)",batch);batch=[]
            if batch:db.executemany("INSERT INTO times VALUES(?,?,?,?,?,?)",batch)
            db.commit()
            # Without this index, each per-stop export scans the entire national timetable.
            db.execute("CREATE INDEX times_by_stop ON times(stop)")
            db.commit()
        out=Path(out);out.mkdir(parents=True,exist_ok=True)
        today=date.today().strftime("%Y%m%d")
        if not any(v["from"]<=today<=v["to"] for v in calendar.values()) and not any(any(x>=today for x in e) for e in exceptions.values()):
            raise ValueError("No current or future service")
        # Shard stop search by stable hash prefix; load a single shard or use local city filtering.
        index=[];written=0
        query=db.execute("SELECT id,name,lat,lon,file FROM stops ORDER BY id")
        for sid,name,lat,lon,file in query:
            records=db.execute("SELECT DISTINCT minute,service,line,direction,type FROM times WHERE stop=? ORDER BY minute",(sid,)).fetchall()
            if not records:continue
            dump(out/"stops"/file[:2]/(file+".json"),records)
            index.append({"id":sid,"name":name,"lat":lat,"lon":lon,"file":file[:2]+"/"+file})
            written+=1
        if written<min_stops:raise ValueError("Too few stops with schedules")
        metadata={"timezone":"Europe/Amsterdam","source":"https://gtfs.ovapi.nl/nl/gtfs-nl.zip","status":"scheduled","license":"NDOV/openOV — verify redistribution attribution"}
        dump(out/"search.json",{**metadata,"stops":index})
        dump(out/"services.json",{**metadata,"calendar":calendar,"exceptions":exceptions})
        dump(out/"validation.json",{"stops":written,"calendars":len(calendar),"exceptions":len(exceptions)})
        db.close()
        return written

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("feed")
    p.add_argument("--out",default="data/netherlands")
    a=p.parse_args()
    with tempfile.TemporaryDirectory() as tmp:
        target=Path(tmp)/"staged"
        n=build(a.feed,target)
        dest=Path(a.out)
        if dest.exists():shutil.rmtree(dest)
        shutil.copytree(target,dest)
        print("Compiled Netherlands GTFS:",n,"scheduled stops (not yet published to app)")
