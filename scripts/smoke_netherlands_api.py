#!/usr/bin/env python3
"""Live API-first smoke: representative Dutch cities, response shape and CORS."""
import argparse
import json
import os
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from datetime import datetime, timezone

BASE="https://api.transitous.org/api/v1/geocode"
TIMES="https://api.transitous.org/api/v6/stoptimes"
CITIES={"Amsterdam":"Amsterdam Centraal","Rotterdam":"Rotterdam Centraal","Utrecht":"Utrecht Centraal","Den Haag":"Den Haag Centraal"}

def check(city,stop):
    query=urlencode({"text":stop+", "+city+", Nederland","type":"STOP"})
    request=Request(BASE+"?"+query,headers={
        "Accept":"application/json",
        "User-Agent":"BusTimer/0.12.0 (+https://github.com/tupolev/bustimer; contact: https://github.com/tupolev/bustimer/issues)"
    })
    with urlopen(request,timeout=25) as response:
        cors=response.headers.get("Access-Control-Allow-Origin")
        document=json.load(response)
    items=document if isinstance(document,list) else document.get("matches",document.get("results",[]))
    if not isinstance(items,list):raise ValueError("Unexpected geocode payload")
    matches=[]
    for item in items:
        place=item.get("place") or item
        ident=place.get("stopId") or place.get("id") or item.get("id")
        name=place.get("name") or place.get("displayName") or item.get("name")
        if ident and name:matches.append({"id":ident,"name":name})
    departures=[]
    errors=[]
    selected=sorted(matches,key=lambda x:(not x["id"].startswith("nl-"),stop.casefold() not in x["name"].casefold()))[:4]
    for candidate in selected:
        params=urlencode({"stopId":candidate["id"],"n":20})
        try:
            with urlopen(Request(TIMES+"?"+params,headers={
                "Accept":"application/json",
                "User-Agent":"BusTimer/0.12.0 (+https://github.com/tupolev/bustimer; contact: https://github.com/tupolev/bustimer/issues)"
            }),timeout=25) as response:
                payload=json.load(response)
                times_cors=response.headers.get("Access-Control-Allow-Origin")
            times=payload.get("stopTimes",[])
            if not isinstance(times,list):raise ValueError("Unexpected stopTimes payload")
            departures.append({"stop_id":candidate["id"],"count":len(times),"cors":times_cors,
              "sample_lines":[str(x.get("routeShortName") or x.get("displayName") or "") for x in times[:3]]})
        except Exception as exc:
            errors.append({"stop_id":candidate["id"],"error":str(exc)})
    # Stop names returned by upstream must remain literal; never invent arrivals.
    return {"query":stop,"matches":matches[:5],"match_count":len(matches),"cors":cors, "cors_note":"CORS must be checked in a real browser; server response alone does not prove browser access",
      "departures":departures,"departure_errors":errors,
      "passed":bool(matches) and any(x["count"]>0 for x in departures)}
def main():
    p=argparse.ArgumentParser();p.add_argument("--report",type=Path,required=True);a=p.parse_args()
    observations={};ok=True
    for city,stop in CITIES.items():
        try: observations[city]=check(city,stop)
        except Exception as exc:observations[city]={"passed":False,"error":str(exc)}
        ok=ok and observations[city]["passed"]
    result={"checked_at":datetime.now(timezone.utc).isoformat(),"run_id":os.getenv("GITHUB_RUN_ID"),
            "passed":ok,"cities":observations,"note":"Live geocode and departure smoke; browser E2E still pending"}
    a.report.parent.mkdir(parents=True,exist_ok=True)
    a.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if not ok:raise SystemExit(1)
if __name__=="__main__":main()
