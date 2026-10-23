import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=fs.readFileSync("index.html","utf8");
const catalog=JSON.parse(fs.readFileSync("countries.json","utf8"));
const enabled=catalog.countries.filter(x=>x.enabled).map(x=>x.id);

test("Netherlands stays enabled via API-first and no Dutch national timetable assets",()=>{
 assert.ok(enabled.includes("netherlands"));
 assert.match(html,/country==="netherlands"/);
 assert.doesNotMatch(html,/data\/netherlands\/(?:stops|services|search)/);
});
test("About gives visible provider acknowledgement and attribution",()=>{
 assert.match(html,/id="tab-about"[\s\S]*?data-i18n="acknowledgementsTitle"/);
 for(const href of ["https://transitous.org/sources/","https://transitous.org/api/","https://www.openstreetmap.org/copyright"]){
  assert.ok(html.includes(href),href);
 }
});
test("About coverage translations include experimental Netherlands",()=>{
 assert.match(html,/coverageText:"[^"]*Netherlands[^"]*"/);
 assert.match(html,/coverageText:"[^"]*Países Bajos[^"]*"/);
 assert.match(html,/coverageText:"[^"]*Niederlande[^"]*"/);
});
