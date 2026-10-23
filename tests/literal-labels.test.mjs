import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const html=fs.readFileSync("index.html","utf8");
const source=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(source);
const from=source.indexOf("const COUNTRY_ISO=");
const to=source.indexOf("const persist=",from);
assert.ok(from>=0&&to>from);
const context=vm.createContext({prefs:{language:"es"},COUNTRY_CATALOG:{germany:{iso:"DE",name:"Deutschland"},spain:{iso:"ES",name:"España"},luxembourg:{iso:"LU",name:"Luxembourg"}},Intl});
vm.runInContext(source.slice(from,to),context);
const name=c=>vm.runInContext("countryLabel",context)(c);
test("countries follow interface language and fall back to literal",()=>{
 assert.equal(name("germany"),"Alemania");
 assert.equal(name("spain"),"España");
 assert.equal(name("unrecognized"),"unrecognized");
 context.prefs.language="de";assert.equal(name("germany"),"Deutschland");
 context.prefs.language="en";assert.equal(name("germany"),"Germany");
});
test("source stop and town labels remain literal",()=>{
 assert.match(source,/button\.textContent=s\.name/);
 assert.match(source,/button\.textContent=item\.label/);
 assert.match(source,/new Option\(x,x\)/);
});
