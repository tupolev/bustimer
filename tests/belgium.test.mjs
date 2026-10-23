import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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
  const service=JSON.parse(fs.readFileSync(path.join(root,"services.json"),"utf8"));
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
