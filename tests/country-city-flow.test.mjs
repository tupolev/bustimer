import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const html=fs.readFileSync("index.html","utf8");
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script);
function section(start,end){const a=script.indexOf(start),b=script.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return script.slice(a,b)}
const cx=vm.createContext({COUNTRY_CATALOG:{germany:{bounds:[47,55,5,16]},spain:{bounds:[27,44,-19,5]},luxembourg:{bounds:[49.43,50.2,5.72,6.55]}},COUNTRY_FALLBACK:{},Set,String,Number,Array,Intl});
vm.runInContext(section("function townCandidates(","$(\"#town-query\").addEventListener"),cx);
vm.runInContext(section("function directionOf(","function renderDirectionOptions()"),cx);
function feature(name,state,type,lon,lat){return {properties:{name,state,type},geometry:{coordinates:[lon,lat]}}}
test("country-filtered city suggestions preserve city and region literally",()=>{
 const data={features:[feature("Köln","Nordrhein-Westfalen","city",6.96,50.94),feature("Bonn","Nordrhein-Westfalen","city",7.1,50.74),feature("Paris","Île-de-France","city",2.35,48.86),feature("Köln","Nordrhein-Westfalen","city",6.96,50.94),feature("Bonn Hbf","Nordrhein-Westfalen","railway",7.1,50.74)]};
 const result=vm.runInContext("townCandidates",cx)(data,"germany");
 assert.deepEqual(Array.from(result,x=>x.label),["Köln · Nordrhein-Westfalen","Bonn · Nordrhein-Westfalen"]);
});
test("country selection bounds prevent cross-border city contamination",()=>{
 const data={features:[feature("Luxembourg","Luxembourg","city",6.13,49.61),feature("Bonn","Nordrhein-Westfalen","city",7.1,50.74)]};
 const result=vm.runInContext("townCandidates",cx)(data,"luxembourg");
 assert.deepEqual(Array.from(result,x=>x.name),["Luxembourg"]);
});
test("line and destination direction remain literal across UI languages",()=>{
 const input=[{_product:"bus",_line:"18",direction:"Köln Hbf"},{_product:"bus",_line:"18",direction:"Köln Hbf"},{_product:"bus",_line:"18",direction:"Bonn Hbf"},{_product:"tram",_line:"18",direction:"Köln Hbf"}];
 const result=vm.runInContext("directionChoices",cx)(input,"bus","18");
 assert.deepEqual(Array.from(result),["Bonn Hbf","Köln Hbf"]);
});
test("localized UI fields exist in English Spanish and German",()=>{
 const localeSource=section("const I18N={","const NETWORKS=");
 const context=vm.createContext({});
 vm.runInContext(localeSource+"\nthis.messages=I18N;",context);
 for(const language of ["en","es","de"]){const dict=context.messages[language];for(const key of ["city","townField","townPlaceholder","stop","transport","line","directionField","selectLine","selectDirection","searchError"])assert.equal(typeof dict[key],"string",language+": "+key)}
});
