#!/usr/bin/env python3
"""Non-gating API coverage audit for German and Spanish core markets.
Records evidence, not a promise of full operator coverage.
"""
import json, os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CASES={
 "DE Köln":{"q":"Köln Neumarkt, Köln, Deutschland","prefix":"de-"},
 "DE Bonn":{"q":"Bonn Hauptbahnhof, Bonn, Deutschland","prefix":"de-"},
 "DE Düsseldorf":{"q":"Düsseldorf Heinrich-Heine-Allee, Düsseldorf, Deutschland","prefix":"de-"},
 "ES Málaga":{"q":"Málaga Alameda Principal, Málaga, España","prefix":"es-"},
 "ES Madrid":{"q":"Madrid Atocha, Madrid, España","prefix":"es-"},
 "ES Barcelona":{"q":"Barcelona Sants, Barcelona, España","prefix":"es-"},
}
UA="BusTimer/0.13.0 (+https://github.com/tupolev/bustimer; contact: https://github.com/tupolev/bustimer/issues)"
def request(path,params):
 url="https://api.transitous.org"+path+"?"+urlencode(params)
 with urlopen(Request(url,headers={"Accept":"application/json","User-Agent":UA}),timeout=25) as res:
  return json.load(res),res.headers.get("Access-Control-Allow-Origin")
def audit(title,config):
 data,cors=request("/api/v1/geocode",{"text":config["q"],"type":"STOP"})
 stops=data if isinstance(data,list) else data.get("matches",data.get("results",[]))
 candidates=[]
 for item in stops:
  p=item.get("place") or item
  sid=p.get("stopId") or p.get("id") or item.get("id")
  name=p.get("name") or p.get("displayName") or item.get("name")
  if sid and name:candidates.append({"id":sid,"name":name})
 inspected=[];errors=[]
 for stop in sorted(candidates,key=lambda x:not x["id"].startswith(config["prefix"]))[:2]:
  try:
   feed,access=request("/api/v6/stoptimes",{"stopId":stop["id"],"n":10})
   times=feed.get("stopTimes",[])
   if not isinstance(times,list):raise ValueError("Invalid stopTimes")
   inspected.append({"stop":stop,"departures":len(times),"cors":access,
    "lines":list(dict.fromkeys(str(x.get("routeShortName") or x.get("displayName") or "") for x in times[:10]))})
  except Exception as exc:errors.append({"stop":stop,"error":str(exc)})
 return {"query":config["q"],"geocode_cors":cors,"candidates":candidates[:6],
         "sampled_departures":inspected,"errors":errors,
         "sample_has_departures":any(s["departures"]>0 for s in inspected)}
def main():
 result={"checked_at":datetime.now(timezone.utc).isoformat(),"run_id":os.getenv("GITHUB_RUN_ID"),
         "scope":"diagnostic samples; not proof of completeness","cases":{}}
 for name,cfg in CASES.items():
  try:result["cases"][name]=audit(name,cfg)
  except Exception as exc:result["cases"][name]={"error":str(exc),"sample_has_departures":False}
 path=Path("docs/validation/germany-spain-api-latest.json")
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({k:{"sample_has_departures":v.get("sample_has_departures"),"error":v.get("error")}
  for k,v in result["cases"].items()},ensure_ascii=False,indent=2))
if __name__=="__main__":main()
