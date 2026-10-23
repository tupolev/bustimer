import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,"application script present");
const start=script.indexOf("const DATA_PROVIDERS=");
const end=script.indexOf("function motisStops(",start);
assert.ok(start>=0&&end>start,"provider integration region exists");
const providerCode=script.slice(start,end);

function harness(respond){
 const calls=[];
 const cachedJSON=async uri=>{calls.push(uri);return respond(uri)};
 const context=vm.createContext({
  console,Date,Math,Number,String,Array,Object,JSON,URLSearchParams,Promise,
  MIN_REFRESH_MS:60000,
  cachedJSON,
  extractMotis: data=>data.items,
  extractDepartures: data=>data.items,
  malagaDepartures: async id=>respond("emt:"+id),
  belgiumDepartures: async (provider,id)=>respond("belgium:"+provider+":"+id),
  url: (city,path)=>"https://regional.test/"+city+path,
  encodeURIComponent
 });
 vm.runInContext(providerCode,context);
 return {calls,departures:(...args)=>context.departures(...args)};
}
const item=(sourceTime,extra={})=>({_line:"1",_product:"bus",direction:"Centro",_time:sourceTime,plannedWhen:"2026-10-23T12:00:00Z",...extra});

test("integration: Spain EMT schedule is returned if Transitous fails",async()=>{
 const h=harness(uri=>{if(uri.startsWith("emt:"))return [item("2026-10-23T12:00:00Z")];throw Error("network unavailable")});
 const departures=await h.departures("spain","emt:22",[{provider:"transitous",id:"T42"}]);
 assert.equal(departures.length,1);
 assert.equal(departures[0]._source,"emt");
 assert.ok(h.calls.some(x=>x.includes("stopId=T42")));
});
test("integration: prefers realtime from second provider",async()=>{
 const h=harness(uri=>uri.startsWith("emt:")?[item("2026-10-23T12:00:00Z")]:{items:[item("2026-10-23T12:03:00Z",{_realtime:true})]});
 const result=await h.departures("spain","emt:22",[{provider:"transitous",id:"T42"}]);
 assert.equal(result.length,1);
 assert.equal(result[0]._source,"transitous");
 assert.equal(result[0]._time,"2026-10-23T12:03:00Z");
});
test("integration: all providers failing surfaces an error",async()=>{
 const h=harness(()=>{throw Error("offline")});
 await assert.rejects(h.departures("germany","T42"),/All sources failed/);
});
test("integration: VBB and DB legacy IDs never leak into Transitous requests",async()=>{
 const h=harness(()=>({items:[item("2026-10-23T12:00:00Z")]}));
 await h.departures("berlin","900000100001");
 await h.departures("cologne","8000207");
 assert.equal(h.calls.length,2);
 assert.ok(h.calls[0].includes("/berlin/stops/900000100001/departures"));
 assert.ok(h.calls[1].includes("/cologne/stops/8000207/departures"));
});

test("integration: Belgian rail timetable survives STIB provider outage",async()=>{
 const h=harness(uri=>{
  if(uri==="belgium:belgiumStib:1000")throw Error("STIB unavailable");
  if(uri==="belgium:belgiumRail:BE:42")return [item("2026-10-23T12:00:00Z",{_realtime:false,when:null,delay:null})];
  throw Error("unexpected provider "+uri);
 });
 const result=await h.departures("belgium","belgiumStib:1000",[{provider:"belgiumRail",id:"BE:42"}]);
 assert.equal(result.length,1);
 assert.equal(result[0]._source,"belgiumRail");
 assert.equal(result[0]._realtime,false);
 assert.equal(result[0].delay,null);
});
test("integration: Belgian operator IDs remain isolated when all sources fail",async()=>{
 const seen=[];
 const h=harness(uri=>{seen.push(uri);throw Error("offline")});
 await assert.rejects(h.departures("belgium","belgiumTec:TEC:123",[{provider:"belgiumDelijn",id:"DL:456"}]),/All sources failed/);
 assert.deepEqual(seen,["belgium:belgiumTec:TEC:123","belgium:belgiumDelijn:DL:456"]);
});
