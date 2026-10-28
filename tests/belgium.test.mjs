import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const cfg=JSON.parse(fs.readFileSync("countries.json","utf8"));
const country=cfg.countries.find(x=>x.id==="belgium");
test("Belgium is enabled as experimental with four independently published operators",()=>{
 assert.ok(country?.enabled);
 assert.equal(country.status,"experimental");
 assert.deepEqual(country.regional,["belgiumRail","belgiumStib","belgiumTec","belgiumDelijn"]);
});
for(const [label,folder,min] of [
 ["SNCB-NMBS","belgium-rail",100],
 ["STIB-MIVB","belgium-stib",100],
 ["LETEC","belgium-tec",500],
 ["De Lijn","belgium-delijn",500],
]){
 test(label+" generated schedules are locally readable and attributed",()=>{
  const root=path.join("data",folder);
  const search=JSON.parse(fs.readFileSync(path.join(root,"search.json"),"utf8"));
  const serviceFile=path.join(root,folder==="belgium-rail"?"services.json.gz":"services.json");
  const raw=fs.readFileSync(serviceFile);
  const service=JSON.parse(folder==="belgium-rail"?zlib.gunzipSync(raw).toString("utf8"):raw.toString("utf8"));
  if(folder==="belgium-rail"){
   assert.ok(raw.length<95_000_000,"SNCB compressed calendar stays below GitHub file limit");
   assert.equal(fs.existsSync(path.join(root,"services.json")),false,"uncompressed oversized SNCB calendar must not be committed");
  }
  assert.ok(search.stops.length>=min);
  assert.equal(search.timezone,"Europe/Brussels");
  assert.match(search.license,/CC BY 4.0/);
  assert.ok(Object.keys(service.calendar).length||Object.keys(service.exceptions).length);
  const sample=search.stops[0];
  assert.ok(sample.id&&sample.name);
  const rows=JSON.parse(fs.readFileSync(path.join(root,"stops",sample.file+".json"),"utf8"));
  assert.ok(Array.isArray(rows)&&rows.length>0);
  assert.ok(rows.every(r=>Array.isArray(r)&&r.length>=5));
 });
}
test("Belgian search and realtime labeling remain distinct",()=>{
 const app=fs.readFileSync("index.html","utf8");
 for(const key of country.regional)assert.ok(app.includes(key));
 assert.match(app,/async function belgiumDepartures/);
 assert.match(app,/when:null,delay:null/);
 assert.match(app,/belgium:"BE"/);
});

test("Belgian multilingual alternative city names resolve to one literal city",()=>{
 const x=JSON.parse(fs.readFileSync("data/towns/be.json","utf8"));
 assert.equal(x.country,"BE");
 const brussels=x.towns.find(row=>row[0]==="Brussels");
 assert.ok(brussels);
 assert.ok(brussels[5].includes("Bruxelles"));
 assert.ok(brussels[5].includes("Brussel"));
});

test("SNCB PWA reader loads the published gzip calendar via DecompressionStream",async()=>{
 const app=fs.readFileSync("index.html","utf8");
 assert.match(app,/provider==="belgiumRail"&&type==="services"/);
 assert.match(app,/services\.json\.gz/);
 assert.match(app,/new DecompressionStream\("gzip"\)/);
 const compressed=fs.readFileSync("data/belgium-rail/services.json.gz");
 const stream=new ReadableStream({start(controller){controller.enqueue(compressed);controller.close();}});
 const response=new Response(stream.pipeThrough(new DecompressionStream("gzip")));
 const services=await response.json();
 assert.ok(Object.keys(services.calendar).length||Object.keys(services.exceptions).length);
});
