import fs from "node:fs";import vm from "node:vm";
const html=fs.readFileSync("index.html","utf8");
const match=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i);
if(!match)throw Error("Missing inline application script");
new vm.Script(match[1],{filename:"index.html:inline"});
new vm.Script(fs.readFileSync("sw.js","utf8"),{filename:"sw.js"});
const catalog=JSON.parse(fs.readFileSync("countries.json","utf8"));
if(!Array.isArray(catalog.countries)||catalog.countries.length<2)throw Error("Invalid country catalog");
const ids=new Set();
for(const item of catalog.countries){
 if(ids.has(item.id))throw Error("Duplicate country: "+item.id);
 ids.add(item.id);
 if(item.enabled&&(!Array.isArray(item.bounds)||item.bounds.length!==4||!item.bounds.every(Number.isFinite)))throw Error("Invalid enabled country: "+item.id);
 if(item.status==="candidate"&&item.enabled)throw Error("Unverified candidate enabled: "+item.id);
 if(item.enabled&&!Array.isArray(item.sources))throw Error("Enabled country lacks sources: "+item.id);
 if(item.officialFeeds&&!item.officialFeeds.every(f=>f.url?.startsWith("https://")&&f.publisher&&f.kind&&f.license))throw Error("Incomplete source metadata: "+item.id);
}
console.log("JavaScript syntax and country catalog: OK");
