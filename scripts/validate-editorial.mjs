import fs from 'node:fs';
import assert from 'node:assert/strict';
const content=JSON.parse(fs.readFileSync('src/data/institutional/content.json','utf8'));
const { careerContent }=await import('../src/data/institutional/careerContent.js');
for(const [route,sections] of Object.entries(careerContent))content[route]={...(content[route]||{}),...sections};
const manifest=JSON.parse(fs.readFileSync('src/integration/eze-cms/claudia-sanchez.manifest.json','utf8'));
assert.equal(manifest.version,1);assert.equal(manifest.site.key,'claudia-sanchez');
const expectedGlobals={'institutional-navbar':content['/'].navbar,'institutional-footer':content['/'].footer};
assert.equal(new Set(manifest.globals.map(g=>g.key)).size,manifest.globals.length);
for(const [key,fallback] of Object.entries(expectedGlobals)){
 const group=manifest.globals.find(g=>g.key===key);assert.ok(group,key);assert.equal(group.published,true);assert.deepEqual(group.initialContent,fallback);
 assert.equal(new Set(group.fields.map(f=>f.path)).size,group.fields.length);
 for(const [path,value] of Object.entries(fallback)){
  const field=group.fields.find(f=>f.path===path);assert.ok(field,`${key}/${path}`);assert.ok(['string','number','image','link'].includes(field.type));assert.notEqual(field.type,'collection');
  if(value&&typeof value==='object'){assert.equal(field.type,'link');assert.ok(value.label);assert.ok(value.href);}
 }
}
let count=0;
for(const [route,sections] of Object.entries(content)){
 const page=manifest.pages.find(p=>p.route===route);assert.ok(page,route);
 for(const [key,fallback] of Object.entries(sections)){
  const section=page.sections.find(s=>s.key===key);assert.deepEqual(section.initialContent,fallback);
  assert.equal(new Set(section.fields.map(f=>f.path)).size,section.fields.length);
  for(const [path,value] of Object.entries(fallback)){
   const field=section.fields.find(f=>f.path===path);assert.ok(field,`${route}/${key}/${path}`);count++;
   if(Array.isArray(value)){assert.equal(field.type,'collection');assert.equal(new Set(value.map(i=>i._id)).size,value.length);for(const item of value){assert.ok(item._id);for(const k of Object.keys(item).filter(k=>k!=='_id'))assert.ok(field.itemFields.some(f=>f.path===k));}}
   if(typeof value==='string')assert.ok(!/\*\*|Nota editorial|PROVISIONAL|Presentación \(`/i.test(value),`${route}/${key}/${path}`);
  }
 }
}
assert.equal(content['/articulos'].listado.items.length,0,'No invented published articles');
assert.equal(content['/personas'].servicios.items.length,3);assert.equal(content['/empresas'].servicios.items.length,2);
assert.equal(content['/'].testimonios.items.length,3);assert.equal(content['/personas'].testimonios.items.length,0);assert.equal(content['/empresas'].testimonios.items.length,0);
assert.equal(content['/personas'].situaciones.items.length,3);assert.equal(content['/empresas'].desafios.items.length,2);
assert.ok(content['/comunidad-y-experiencias']);
console.log(`OK: ${Object.keys(content).length} páginas, ${manifest.globals.length} globales, ${count} campos, colecciones, copy y manifiesto.`);
