import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
const html=fs.readFileSync("index.html","utf8");
const sw=fs.readFileSync("sw.js","utf8");
const countries=JSON.parse(fs.readFileSync("countries.json","utf8"));
test("release version and installed app agree",()=>{
 assert.equal(pkg.version,"0.13.0");
 assert.match(html,/Version 0\.13\.0/);
 assert.match(sw,/bustimer-shell-v34/);
});
test("fourteen enabled countries include eight experimental API-first additions",()=>{
 const enabled=countries.countries.filter(c=>c.enabled);
 assert.equal(enabled.length,14);
 for(const id of ["austria","switzerland","italy","czechia","poland","denmark","sweden"])assert.equal(enabled.find(c=>c.id===id)?.status,"experimental");
 assert.equal(enabled.find(c=>c.id==="netherlands")?.status,"experimental");
});
test("readme credits remain visible",()=>{
 const readme=fs.readFileSync("README.md","utf8");
 assert.match(readme,/## Acknowledgements and data attribution/);
 assert.match(readme,/## Release v0\.13\.0/);
 assert.match(readme,/https:\/\/transitous\.org\/sources\//);
});

test("new brand is consistent between SVG icon, manifest and HTML",()=>{
 const svg=fs.readFileSync("icon.svg","utf8");
 const manifest=JSON.parse(fs.readFileSync("manifest.webmanifest","utf8"));
 assert.match(svg,/viewBox="0 0 192 192"/);
 assert.match(svg,/#FFC629/);
 assert.match(svg,/#092A52/);
 assert.equal(manifest.theme_color,"#092A52");
 assert.match(html,/class="logo-icon" src="\.\/icon.svg"/);
 assert.match(html,/--accent:#FFC629/);
});

test("station cards group only identical source stop IDs, preserving independent line rows",()=>{
 assert.match(html,/function groupFavoriteStops\(stops\)/);
 assert.match(html,/String\(stop.city\)\+":"\+String\(stop.stopId\)/);
 assert.match(html,/for\(const group of groupFavoriteStops\(saved\)\)/);
 assert.match(html,/for\(const s of group\)/);
 assert.match(html,/row.dataset.favoriteId=String\(s.id\)/);
 assert.match(html,/escapeHTML\(s.line\)/);
 assert.match(html,/s.direction/);
 assert.match(html,/saved=saved.filter\(x=>x.id!==s.id\)/);
 assert.match(html,/\.station-card\{/);
});
