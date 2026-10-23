"""Synthetic VRS GTFS importer regression tests (no external network)."""
import csv
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from datetime import datetime, timezone
from importlib.util import spec_from_file_location, module_from_spec

spec=spec_from_file_location("build_vrs","scripts/build_vrs.py")
module=module_from_spec(spec)
spec.loader.exec_module(module)

class VRSImporterTests(unittest.TestCase):
    def test_streaming_rows_and_compilation(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            zfile=root/"fixture.zip"
            today=datetime.now(timezone.utc).strftime("%Y%m%d")
            fixtures={
                "routes.txt":(["route_id","route_short_name","route_type"],[["r1","66","3"]]),
                "trips.txt":(["trip_id","route_id","service_id","trip_headsign"],[["t1","r1","work","Bonn Hbf"]]),
                "calendar.txt":(["service_id","start_date","end_date","monday","tuesday","wednesday","thursday","friday","saturday","sunday"],[["work","20260101","20281231","1","1","1","1","1","1","1"]]),
                "calendar_dates.txt":(["service_id","date","exception_type"],[["work",today,"1"]]),
                "stops.txt":(["stop_id","stop_name","stop_lat","stop_lon"],[[f"vrs:stop:{i}",f"Stop {i}","50.73","7.10"] for i in range(101)]),
                "stop_times.txt":(["trip_id","stop_id","arrival_time","departure_time"],[["t1",f"vrs:stop:{i}","25:12:00","25:12:00"] for i in range(101)]),
            }
            import io
            with zipfile.ZipFile(zfile,"w",compression=zipfile.ZIP_DEFLATED) as z:
                for name,(header,data) in fixtures.items():
                    f=io.StringIO()
                    writer=csv.writer(f)
                    writer.writerow(header)
                    writer.writerows(data)
                    z.writestr(name,f.getvalue())
            target=root/"output"
            module.build(zfile,target)
            idx=json.loads((target/"index.json").read_text())
            self.assertEqual(len(idx["stops"]),101)
            self.assertEqual(idx["timezone"],"Europe/Berlin")
            item=idx["stops"][0]
            self.assertEqual(item["id"],"vrs:stop:0")
            self.assertEqual(len(item["file"]),24)
            self.assertEqual(json.loads((target/"stops"/(item["file"]+".json")).read_text())[0][0],1512)
            self.assertTrue(idx["exceptions"]["work"][today])
    def test_invalid_archive_does_not_replace_data(self):
        with tempfile.TemporaryDirectory() as td:
            zfile=Path(td)/"broken.zip"
            with zipfile.ZipFile(zfile,"w") as z:z.writestr("routes.txt","route_id\nr1\n")
            with self.assertRaisesRegex(ValueError,"GTFS missing"):
                module.build(zfile,Path(td)/"bad")
if __name__=="__main__":unittest.main()
