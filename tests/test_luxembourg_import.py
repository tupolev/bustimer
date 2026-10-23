import unittest
from importlib.util import module_from_spec,spec_from_file_location
from pathlib import Path
spec=spec_from_file_location("build_luxembourg",str(Path("scripts/build_luxembourg.py")))
import sys
sys.path.insert(0,"scripts")
module=module_from_spec(spec)
spec.loader.exec_module(module)

class LuxembourgCatalogTests(unittest.TestCase):
    def test_latest_release_and_host(self):
        resources=[
            {"title":"gtfs-20261007-20261212.zip","url":"https://download.data.public.lu/old.zip","last_modified":"2026-10-08T00:00:00Z"},
            {"title":"gtfs-20261021-20261212.zip","url":"https://download.data.public.lu/new.zip","last_modified":"2026-10-22T00:00:00Z"}]
        self.assertEqual(module.newest_feed(resources),"https://download.data.public.lu/new.zip")
    def test_missing_resource_and_unknown_host(self):
        with self.assertRaisesRegex(ValueError,"No GTFS"):
            module.newest_feed([])
        with self.assertRaisesRegex(ValueError,"Unexpected"):
            module.newest_feed([{"title":"gtfs-now.zip","url":"https://not-official.example/a.zip"}])
if __name__=="__main__":unittest.main()
