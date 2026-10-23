#!/usr/bin/env python3
"""Compile per-country offline town suggestions from GeoNames cities500 (CC BY 4.0)."""
import csv,io,json,sys,urllib.request,zipfile
from collections import defaultdict
from pathlib import Path
COUNTRIES={"DE","ES","FR","PT","LU"}
SRC="https://download.geonames.org/export/dump/"
def build(text,admin):
    towns=defaultdict(list)
    for cols in csv.reader(io.StringIO(text),delimiter="\t"):
        if len(cols)<19 or cols[8] not in COUNTRIES or cols[6]!="P":continue
        try:lat,lon=float(cols[4]),float(cols[5])
        except ValueError:continue
        state=admin.get(cols[8]+"."+cols[10],"")
        towns[cols[8]].append([cols[1],state,round(lat,5),round(lon,5),int(cols[14] or 0)])
    return {c:sorted(items,key=lambda x:(-x[4],x[0])) for c,items in towns.items()}
def main():
    def download(name):
        req=urllib.request.Request(SRC+name,headers={"User-Agent":"BusTimer/1.0 (+https://github.com/tupolev/bustimer)"})
        with urllib.request.urlopen(req,timeout=90) as r:return r.read()
    data=download("cities500.zip")
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        text=archive.read("cities500.txt").decode("utf-8")
    codes=download("admin1CodesASCII.txt").decode("utf-8")
    admin={row[0]:row[2] for row in csv.reader(io.StringIO(codes),delimiter="\t") if len(row)>=3}
    result=build(text,admin);dest=Path("data/towns");dest.mkdir(parents=True,exist_ok=True)
    for country in sorted(COUNTRIES):
        items=result[country]
        if len(items)<20:raise ValueError(f"Too few {country} towns: {len(items)}")
        (dest/(country.lower()+".json")).write_text(json.dumps({"source":"GeoNames cities500","license":"CC BY 4.0","country":country,"towns":items},ensure_ascii=False,separators=(",",":")),encoding="utf-8")
        print(country,len(items))
if __name__=="__main__":main()
