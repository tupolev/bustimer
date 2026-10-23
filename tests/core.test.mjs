import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const html=fs.readFileSync("index.html","utf8");
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,"inline app script found");
function extract(begin,end){const s=script.indexOf(begin),e=script.indexOf(end,s+begin.length);assert.ok(s>=0&&e>s,"functions found: "+begin);return script.slice(s,e)}
const library="const DATA_PROVIDERS={emt:()=>{},vbb:()=>{},db:()=>{},vrs:()=>{},lux:()=>{},belgiumRail:()=>{},transitous:()=>{}};\n"+extract("function defaultProvider(","async function departures(city,id,more=[]){")
 +extract("function motisStops(","let debounceSeq=0,");
const context=vm.createContext({console,Date,Math,Number,String,Array,Object,JSON,Intl,URLSearchParams});
vm.runInContext(library,context);
const call=(name,...args)=>vm.runInContext(name,context)(...args);
test("legacy favorites route to original provider",()=>{
 assert.equal(call("defaultProvider","malaga","22"),"emt");
 assert.equal(call("defaultProvider","berlin","9000001"),"vbb");
 assert.equal(call("defaultProvider","cologne","8000001"),"db");
 assert.equal(call("defaultProvider","germany","motis-id"),"transitous");
 assert.equal(call("defaultProvider","france","motis-id"),"transitous");
});
test("provider identifiers kept separate and duplicates removed",()=>{
 const refs=call("providerLinks","spain","emt:22",[{provider:"emt",id:"22"},{provider:"transitous",id:"T42"}]);
 assert.equal(refs.length,2);assert.equal(refs[0].id,"22");assert.equal(refs[1].id,"T42");
});
test("same source departures remain separate",()=>{
 const base={_line:"1",_product:"bus",direction:"Centro",plannedWhen:"2026-10-23T10:00:00Z",_time:"2026-10-23T10:00:00Z"};
 const input=[{...base,_source:"emt"},{...base,_source:"emt",_time:"2026-10-23T10:01:00Z"}];
 assert.equal(call("mergeDepartures",input).length,2);
});
test("realtime preferred for overlapping cross-provider departure",()=>{
 const base={_line:"1",_product:"bus",direction:"Centro",plannedWhen:"2026-10-23T10:00:00Z"};
 const result=call("mergeDepartures",[{...base,_source:"emt",_time:"2026-10-23T10:00:00Z"},{...base,_source:"transitous",_time:"2026-10-23T10:03:00Z",_realtime:true}]);
 assert.equal(result.length,1);assert.equal(result[0]._source,"transitous");
});
test("stop matching requires both similar name and close coordinates",()=>{
 const items=[{name:"Plaza de la Merced · Málaga",id:"emt:22",provider:"emt",lat:36.72364,lon:-4.4163},{name:"Plaza de la Merced",id:"external",provider:"transitous",lat:36.72366,lon:-4.41631},{name:"Plaza de la Merced",id:"far",provider:"transitous",lat:37.0,lon:-4.4163}];
 const result=call("joinProviderStops",items);
 assert.equal(result.length,2);assert.equal(result[0].providers.length,2);
});
test("country region filter rejects distant results",()=>{
 assert.equal(call("inBounds",{lat:48.85,lon:2.35},[41.2,51.3,-5.3,9.8]),true);
 assert.equal(call("inBounds",{lat:40.4,lon:-3.7},[41.2,51.3,-5.3,9.8]),false);
});
test("malformed app scripts fail parser",()=>{
 assert.throws(()=>new vm.Script("const broken = ;"),SyntaxError);
});

test("VRS filenames and namespace remain distinct from Transitous IDs",()=>{
 assert.equal(call("defaultProvider","germany","vrs:de:05314:61101:7:73"),"vrs");
 const refs=call("providerLinks","germany","vrs:de:05314:61101:7:73",[{provider:"transitous",id:"de:05314:61101:7:73"}]);
 assert.equal(refs.length,2);
 assert.equal(refs[0].id,"de:05314:61101:7:73");
});

test("Luxembourg source IDs stay local to official GTFS provider",()=>{
 assert.equal(call("defaultProvider","luxembourg","lux:stop:123"),"lux");
 const refs=call("providerLinks","luxembourg","lux:stop:123",[]);
 assert.equal(refs.length,1);
 assert.equal(refs[0].id,"stop:123");
});

test("Belgian rail favorites keep source identity",()=>{
 assert.equal(call("defaultProvider","belgium","belgiumRail:123"),"belgiumRail");
 const ids=call("providerLinks","belgium","belgiumRail:123",[{provider:"belgiumRail",id:"123"}]);
 assert.equal(ids.length,1);assert.equal(ids[0].id,"123");
});
