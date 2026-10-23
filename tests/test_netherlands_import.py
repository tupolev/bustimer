import csv
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from build_netherlands import build

class NetherlandsGTFSFixture(unittest.TestCase):
    def test_calendar_dates_and_sharded_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            archive=root/"fixture.zip"
            stops="stop_id,stop_name,stop_lat,stop_lon\n"+ "".join(f"s{i},Station {i},52.09,5.12\n" for i in range(4))
            gtfs={
                "stops.txt":stops,
                "routes.txt":"route_id,route_short_name,route_type\nr1,12,3\n",
                "trips.txt":"route_id,service_id,trip_id,trip_headsign\nr1,service,t1,Centraal\n",
                "stop_times.txt":"trip_id,arrival_time,departure_time,stop_id\n"+ "".join(f"t1,25:10:00,25:10:00,s{i}\n" for i in range(4)),
                "calendar_dates.txt":"service_id,date,exception_type\nservice,20991231,1\n"
            }
            with zipfile.ZipFile(archive,"w",compression=zipfile.ZIP_DEFLATED) as z:
                for name,content in gtfs.items():z.writestr(name,content)
            out=root/"out"
            self.assertEqual(build(archive,out,min_stops=2),4)
            index=json.loads((out/"search.json").read_text())
            services=json.loads((out/"services.json").read_text())
            self.assertEqual(index["timezone"],"Europe/Amsterdam")
            self.assertEqual(services["exceptions"]["service"]["20991231"],True)
            for row in index["stops"]:
                records=json.loads((out/"stops"/(row["file"]+".json")).read_text())
                self.assertEqual(records[0][:3],[1510,"service","12"])
if __name__=="__main__":unittest.main()
