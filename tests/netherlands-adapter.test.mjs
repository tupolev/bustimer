import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const html=fs.readFileSync("index.html","utf8");
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script);
test("Netherlands stays disabled until shards are deployed",()=>{
 const catalog=JSON.parse(fs.readFileSync("countries.json","utf8"));
 const nl=catalog.countries.find(c=>c.id==="netherlands");
 assert.ok(nl);assert.equal(nl.enabled,false);
 assert.equal(nl.status,"candidate");
});
test("Dutch IDs survive saved-stop normalization",()=>{
 assert.match(script,/String\(id\)\.startsWith\("nl:"\)\?"nl"/);
 assert.match(script,/emt\|vrs\|lux\|nl\|belgiumRail/);
});
test("Dutch stop departures retain timetable-only status and service-date rules",()=>{
 const start=script.indexOf("async function netherlandsDepartures(");
 const end=script.indexOf("const DATA_PROVIDERS=",start);
 assert.ok(start>=0&&end>start);
 const source=script.slice(start,end);
 assert.match(source,/serviceRuns\(services,service,day\)/);
 assert.match(source,/berlinTimestamp\(day,minute\)/);
 assert.match(source,/_realtime|when:null/);
});
test("country lookup supports Netherlands without switching it on",()=>{
 assert.match(script,/country==="netherlands"/);
 assert.match(script,/"netherlands"\]\.includes\(c\.id\)/);
});
