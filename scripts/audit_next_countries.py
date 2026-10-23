#!/usr/bin/env python3
"""Non-gating live Transitous evidence for potential country expansion."""
import json,os,math
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode

UA="BusTimer/0.13.0 (+https://github.com/tupolev/bustimer; contact: https://github.com/tupolev/bustimer/issues)"
LOCATIONS={
 "austria":("Wien Hauptbahnhof, Wien, Österreich",(48.186,16.376)),
 "switzerland":("Zürich HB, Zürich, Schweiz",(47.378,8.541)),
 "italy":("Milano Centrale, Milano, Italia",(45.486,9.205)),
 "czechia":("Praha hlavní nádraží, Praha, Česko",(50.083,14.434)),
}
def get(path,params):
 u="https://api.transitous.org"+path+"?"+urlencode(params)
 with urlopen(Request(u,headers={"User-Agent":UA,"Accept":"application/json"}),timeout=25) as r:
  return json.load(r),r.headers.get("Access-Control-Allow-Origin")
def distance(point,center):
 try:
  lat=float(point.get("lat",point.get("latitude")))
  lon=float(point.get("lon",point.get("longitude")))
  return math.hypot((lat-center[0])*111.2,(lon-center[1])*111.2*math.cos(math.radians(center[0])))
 except (TypeError,ValueError):return float("inf")
def inspect(q,center):
 data,cors=get("/api/v1/geocode",{"text":q,"type":"STOP"})
 raw=data if isinstance(data,list) else data.get("matches",data.get("results",[]))
 near=[]
 for item in raw:
  place=item.get("place") or item
  stopid=place.get("stopId") or place.get("id") or item.get("id")
  name=place.get("name") or place.get("displayName") or item.get("name")
  if not(stopid and name):continue
  if distance(place,center)<=12:near.append({"id":stopid,"name":name})
 times=[]
 for stop in near[:3]:
  try:
   feed,c=get("/api/v6/stoptimes",{"stopId":stop["id"],"n":20})
   rows=feed.get("stopTimes",[])
   times.append({"stop":stop,"count":len(rows) if isinstance(rows,list) else 0,"cors":c,
                 "sample_lines":[str(x.get("routeShortName") or "") for x in rows[:4]]})
  except Exception as exc:times.append({"stop":stop,"error":str(exc),"count":0})
 return {"query":q,"geocode_cors":cors,"nearby":near[:5],"times":times,
         "passed":bool(near) and any(x["count"]>0 and x.get("cors")=="*" for x in times)}
def main():
 result={"checked_at":datetime.now(timezone.utc).isoformat(),"run_id":os.getenv("GITHUB_RUN_ID"),"countries":{}}
 for country,(q,point) in LOCATIONS.items():
  try:result["countries"][country]=inspect(q,point)
  except Exception as e:result["countries"][country]={"passed":False,"error":str(e)}
 out=Path("docs/validation/next-countries-api.json");out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:{"passed":v["passed"],"error":v.get("error")} for k,v in result["countries"].items()}))
if __name__=="__main__":main()
