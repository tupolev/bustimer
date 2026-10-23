import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script);
const start=script.indexOf("async function refreshAll()");
const end=script.indexOf('$("#refresh").addEventListener',start);
assert.ok(start>=0&&end>start,"refresh handler is present");
const refreshSource=script.slice(start,end);
const time="2026-10-23T12:15:00Z";
function setup(provider){
 const favorite={id:"favorite1",city:"belgium",stopId:"belgiumStib:1000",line:"1",type:"tram",direction:"Gare du Nord",providers:[]};
 const departure={_line:"1",_product:"tram",direction:"Gare du Nord",_time:time};
 const departureState={favorite1:{departure,loading:false,error:false}};
 const refreshButton={disabled:false};
 let renderCount=0;
 const context=vm.createContext({
  saved:[favorite],departureState,refreshBusy:false,Date,Promise,Map,
  $:()=>refreshButton,renderCards:()=>{renderCount++},
  departures:provider,directionOf:d=>d.direction
 });
 vm.runInContext(refreshSource,context);
 return {refresh:context.refreshAll,departureState,refreshButton,renderCount:()=>renderCount};
}
test("provider outage clears previously shown departure and marks failure",async()=>{
 const h=setup(async()=>{throw Error("offline")});
 await h.refresh();
 assert.equal(h.departureState.favorite1.departure,null);
 assert.equal(h.departureState.favorite1.error,true);
 assert.equal(h.departureState.favorite1.loading,false);
 assert.equal(h.refreshButton.disabled,false);
 assert.ok(h.renderCount()>0);
});
test("successful empty timetable replaces previously shown departure",async()=>{
 const h=setup(async()=>[]);
 await h.refresh();
 assert.equal(h.departureState.favorite1.departure,null);
 assert.equal(h.departureState.favorite1.error,false);
 assert.equal(h.departureState.favorite1.loading,false);
});
