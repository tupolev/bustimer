import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,"app script found");
function slice(start,end){
 const a=script.indexOf(start),b=script.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,"missing app function "+start);
 return script.slice(a,b);
}
const snippets=[
 slice("function stopDistance(","async function regionalStops("),
 slice("async function searchCountryStops(","async function searchGermanyStops(")
].join("\n");
const central={lat:50.8451,lon:4.3596};
const indexes={
 belgiumStib:[{id:"1000",name:"GARE CENTRALE",...central},{id:"1001",name:"GARE CENTRALE",lat:50.84511,lon:4.35961}],
 belgiumRail:[{id:"BE:42",name:"Gare Centrale",lat:50.84512,lon:4.35962}],
 belgiumTec:[{id:"777",name:"GARE CENTRALE",lat:50.84513,lon:4.35963},{id:"888",name:"GARE CENTRALE",lat:51.10,lon:4.38}],
 belgiumDelijn:[{id:"DL1",name:"CENTRAAL",lat:51.05,lon:3.73}]
};
function harness(town){
 const ctx=vm.createContext({
  console,Number,String,Array,Object,Math,Promise,URLSearchParams,
  COUNTRY_CATALOG:{belgium:{geocode:"Belgium",bounds:[49.48,51.52,2.5,6.42],regional:Object.keys(indexes)}},
  cachedJSON:async()=>{throw Error("Belgium search must not require Transitous")},
  motisStops:()=>{throw Error("unexpected Transitous search")},
  regionalStops:async(provider,q)=>indexes[provider].filter(s=>s.name.toLowerCase().includes(q.toLowerCase())).map(s=>({...s,id:provider+":"+s.id,provider})),
  chosenTown:town
 });
 vm.runInContext(snippets,ctx);
 return ctx.searchCountryStops;
}
test("Belgian search preserves two STIB platforms while merging colocated operators",async()=>{
 const search=harness({name:"Bruxelles",lat:50.845,lon:4.36});
 const stops=await search("belgium","Gare Centrale","Bruxelles");
 assert.equal(stops.length,2);
 const joined=stops.find(s=>s.providers.length===3);
 assert.ok(joined,"three colocated operator references expected");
 assert.deepEqual(Array.from(joined.providers,x=>x.provider),["belgiumStib","belgiumRail","belgiumTec"]);
 assert.deepEqual(Array.from(stops.find(s=>s.providers.length===1).providers,x=>x.id),["1001"]);
 assert.equal(joined.providers[1].id,"BE:42");
});
test("Belgian search bounds stops to selected city and preserves literal names",async()=>{
 const search=harness({name:"Bruxelles",lat:50.845,lon:4.36});
 const stops=await search("belgium","GARE CENTRALE","Bruxelles");
 assert.ok(stops.every(s=>s.name==="GARE CENTRALE"));
 assert.ok(stops.every(s=>s.lat<50.86),"remote identically named TEC stop excluded");
});
