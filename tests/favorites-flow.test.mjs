import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script,"inline application found");
function section(start,end){
 const a=script.indexOf(start),b=script.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,"missing application section "+start);
 return script.slice(a,b);
}
const workflow=section("function renderTransportOptions()","function renderCards()");
class FakeSelect {
 constructor(){this.options=[];this.value="";this.disabled=false;this.handlers={};}
 replaceChildren(...items){this.options=items;this.value=items[0]?.value??"";}
 add(item){this.options.push(item);}
 addEventListener(type,fn){this.handlers[type]=fn;}
 choose(value){assert.ok(this.options.some(x=>x.value===value),"option exists: "+value);this.value=value;this.handlers.change?.();}
}
function Option(label,value){this.text=label;this.value=value;}
function fixture(){
 const elements=Object.fromEntries(["transport","line","direction","save","form-error"].map(k=>[k,new FakeSelect()]));
 const storage=new Map(),saved=[];
 const state={city:"belgium",stop:{id:"belgiumStib:1000",name:"GARE CENTRALE",providers:[{provider:"belgiumStib",id:"1000"},{provider:"belgiumRail",id:"BE:42"}]},departures:[
  {_product:"tram",_line:"1",direction:"Gare du Nord"},
  {_product:"tram",_line:"1",direction:"Gare du Midi"},
  {_product:"bus",_line:"29",direction:"De Brouckère"}
 ]};
 const context=vm.createContext({
  console,Option,Set,String,Array,Object,
  state,saved,
  crypto:{randomUUID:()=>String(saved.length+1)},
  $:q=>elements[q.slice(1)],
  t:x=>x,
  persist:()=>storage.set("bustimer:stops",JSON.stringify(saved)),
  resetForm:()=>{state.stop=null;},
  tab:()=>{}
 });
 vm.runInContext(workflow,context);
 return {elements,state,saved,storage,renderTransportOptions:context.renderTransportOptions};
}
test("Belgian flow: transport, line, literal direction and favorite survive reload",()=>{
 const h=fixture();
 h.renderTransportOptions();
 h.elements.transport.choose("tram");
 h.elements.line.choose("1");
 assert.deepEqual(h.elements.direction.options.map(x=>x.value).slice(1),["Gare du Midi","Gare du Nord"]);
 assert.equal(h.elements.save.disabled,true);
 h.elements.direction.choose("Gare du Nord");
 assert.equal(h.elements.save.disabled,false);
 h.elements.save.handlers.click();
 const reloaded=JSON.parse(h.storage.get("bustimer:stops"));
 assert.equal(reloaded.length,1);
 assert.equal(reloaded[0].city,"belgium");
 assert.equal(reloaded[0].stopId,"belgiumStib:1000");
 assert.equal(reloaded[0].line,"1");
 assert.equal(reloaded[0].direction,"Gare du Nord");
 assert.equal(reloaded[0].providers[1].id,"BE:42");
});
test("Belgian favorites: opposite directions can be saved separately, duplicates rejected",()=>{
 const h=fixture();
 h.renderTransportOptions();
 h.elements.transport.choose("tram");
 h.elements.line.choose("1");
 h.elements.direction.choose("Gare du Nord");
 h.elements.save.handlers.click();
 h.state.stop={id:"belgiumStib:1000",name:"GARE CENTRALE",providers:[]};
 h.elements.direction.choose("Gare du Midi");
 h.elements.save.handlers.click();
 assert.equal(h.saved.length,2);
 h.state.stop={id:"belgiumStib:1000",name:"GARE CENTRALE",providers:[]};
 h.elements.direction.choose("Gare du Midi");
 h.elements.save.handlers.click();
 assert.equal(h.saved.length,2);
 assert.equal(h.elements["form-error"].textContent,"already");
});
