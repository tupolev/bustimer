import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script);
const catalog=JSON.parse(fs.readFileSync("countries.json","utf8"));
const country=catalog.countries.find(c=>c.id==="netherlands");

test("Netherlands API-first code stays gated after upstream 403",()=>{
 assert.ok(country);
 assert.deepEqual(country.sources,["transitous"]);
 assert.deepEqual(country.regional,[]);
 assert.equal(country.enabled,false);
 assert.equal(country.status,"candidate");
 assert.doesNotMatch(script,/data\/netherlands\/(?:search|services|stops)/);
 assert.doesNotMatch(script,/async function netherlandsDepartures/);
});
test("Dutch stop IDs use Transitous without NL prefix rewriting",()=>{
 const start=script.indexOf("function defaultProvider(");
 const end=script.indexOf("function mergeDepartures(",start);
 assert.ok(start>=0&&end>start);
 const source=script.slice(start,end);
 const context=vm.createContext({DATA_PROVIDERS:{transitous:()=>[]}});
 vm.runInContext(source,context);
 assert.equal(context.defaultProvider("netherlands","nl:stop:123"),"transitous");
 const refs=context.providerLinks("netherlands","nl:stop:123");
 assert.equal(refs.length,1);
 assert.equal(refs[0].id,"nl:stop:123");
});
test("Dutch stop discovery invokes national HTTPS API and preserves selected-city filtering",async()=>{
 const start=script.indexOf("async function searchCountryStops(");
 const end=script.indexOf("async function searchGermanyStops(",start);
 assert.ok(start>=0&&end>start);
 const context=vm.createContext({
  COUNTRY_CATALOG:{netherlands:{geocode:"Nederland",bounds:[50.73,53.75,3.25,7.3],regional:[]}},
  URLSearchParams,Promise,
  cachedJSON:async(url)=>{
   assert.match(url,/^https:\/\/api\.transitous\.org\/api\/v1\/geocode\?/);
   return {stub:true};
  },
  motisStops:()=>[{id:"dutch:1",name:"Centraal",latitude:52.09,longitude:5.12,type:"stop"}],
  inBounds:()=>true,
  chosenTown:{name:"Utrecht",lat:52.09,lon:5.12},
  stopDistance:()=>0,
  canonicalStopName:x=>String(x).toLowerCase(),
  regionalStops:async()=>{throw Error("should not call local GTFS")},
  joinProviderStops:x=>x.map(s=>({...s,providers:[{provider:s.provider,id:s.id}]}))
 });
 vm.runInContext(script.slice(start,end),context);
 const results=await context.searchCountryStops("netherlands","Centraal","Utrecht");
 assert.equal(results.length,1);
 assert.equal(results[0].provider,"transitous");
 assert.equal(results[0].id,"dutch:1");
});
test("Dutch departures use existing Transitous HTTPS stop-times adapter",()=>{
 assert.match(script,/https:\/\/api\.transitous\.org\/api\/v6\/stoptimes\?/);
 assert.match(script,/transitous: id=>cachedJSON/);
});
