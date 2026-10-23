#!/usr/bin/env python3
"""Stage operator GTFS from a public mirrored snapshot; never publish partially parsed feeds."""
import argparse,shutil,tempfile,urllib.request
from pathlib import Path
from build_vrs import build
FEEDS={
 "stib":("https://gtfs.flatturtle.cloud/stib-mivb/_latest/stib-mivb-gtfs.zip",(50.72,50.99,4.2,4.65),100),
 "tec":("https://gtfs.flatturtle.cloud/tec/_latest/tec-gtfs.zip",(49.45,51.45,2.45,6.5),500),
 "delijn":("https://gtfs.flatturtle.cloud/delijn/_latest/delijn-gtfs.zip",(49.45,51.6,2.4,6.55),500),
}
def main():
 p=argparse.ArgumentParser();p.add_argument("--operator",required=True,choices=sorted(FEEDS));p.add_argument("--source");p.add_argument("--out");args=p.parse_args()
 origin,bounds,min_stops=FEEDS[args.operator];url=args.source or origin
 with tempfile.TemporaryDirectory() as tmp:
  root=Path(tmp);archive=root/"gtfs.zip"
  if url.startswith("https://"):
   req=urllib.request.Request(url,headers={"User-Agent":"BusTimer/Belgium-GTFS (+https://github.com/tupolev/bustimer)"})
   with urllib.request.urlopen(req,timeout=180) as response,archive.open("wb") as dest:shutil.copyfileobj(response,dest)
  else:shutil.copyfile(url,archive)
  compiled=root/"compiled"
  attribution={"stib":"STIB-MIVB","tec":"LETEC","delijn":"De Lijn"}[args.operator]
  build(archive,compiled,bounds=bounds,source=url,license="CC BY 4.0 — Source: "+attribution+" - Open Data; https://data.belgianmobility.io/en/terms.html",timezone_name="Europe/Brussels",min_stops=min_stops)
  dest=Path(args.out or "data/belgium-"+args.operator)
  if dest.exists():shutil.rmtree(dest)
  dest.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(compiled,dest)
if __name__=="__main__":main()
