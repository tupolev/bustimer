import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const html=fs.readFileSync("index.html","utf8");
const src=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(src,"inline application script");
const from=src.indexOf("const berlinFormatter=");
const until=src.indexOf("function vrsStopFile(",from);
assert.ok(from>=0&&until>from,"timezone functions available");
const cx=vm.createContext({Date,Intl,Object,Math,Number,String});
vm.runInContext(src.slice(from,until),cx);
const at=(date,minute)=>vm.runInContext("berlinTimestamp",cx)(new Date(date+"T12:00:00Z"),minute);
test("Berlin regular winter and summer offsets",()=>{
 assert.equal(at("2026-01-15",600).toISOString(),"2026-01-15T09:00:00.000Z");
 assert.equal(at("2026-07-15",600).toISOString(),"2026-07-15T08:00:00.000Z");
});
test("Berlin spring DST gap is not invented",()=>{
 assert.equal(at("2026-03-29",150),null);
 assert.equal(at("2026-03-29",210).toISOString(),"2026-03-29T01:30:00.000Z");
});
test("Berlin autumn repeated hour chooses the first occurrence",()=>{
 assert.equal(at("2026-10-25",150).toISOString(),"2026-10-25T00:30:00.000Z");
 assert.equal(at("2026-10-25",210).toISOString(),"2026-10-25T02:30:00.000Z");
});
test("GTFS service time beyond midnight advances the date",()=>{
 assert.equal(at("2026-10-23",1515).toISOString(),"2026-10-23T23:15:00.000Z");
});
