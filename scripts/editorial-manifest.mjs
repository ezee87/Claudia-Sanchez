import fs from 'node:fs';
const path='src/integration/eze-cms/claudia-sanchez.manifest.json';
const data=JSON.parse(fs.readFileSync('src/data/institutional/content.json','utf8'));
const { careerContent }=await import('../src/data/institutional/careerContent.js');
const { site }=await import('../src/data/claudia/site.js');
for(const [route,sections] of Object.entries(careerContent))if(route!=='/personas')data[route]={...(data[route]||{}),...sections};
const manifest=JSON.parse(fs.readFileSync(path,'utf8'));
const article={slug:'',title:'',publishedAt:'',cover:'',alt:'',body:'',status:'draft',visible:1};
function fields(content){return Object.entries(content).filter(([k])=>k!=='_id').flatMap(([key,value])=>{
  // Eze collections only accept arrays of objects. Primitive arrays are exposed
  // as individually editable scalar paths while their runtime shape stays intact.
  if(Array.isArray(value)&&value.length&&value.every(item=>item===null||typeof item!=='object')){
    return value.map((item,index)=>({key:`${key}-${index}`,path:`${key}.${index}`,label:`${key} ${index+1}`,type:typeof item==='number'?'number':'string',...(typeof item==='string'?{multiline:true}:{})}));
  }
  const type=Array.isArray(value)?'collection':typeof value==='number'?'number':value&&typeof value==='object'?'link':['image','cover'].includes(key)?'image':'string';
  return {key,path:key,label:key,type,...(type==='string'?{multiline:true}:{}),...(type==='collection'?{minItems:0,maxItems:200,itemFields:fields(value[0]||article)}:{})};
});}
for(const [route,sections] of Object.entries(data)){
  const key=route==='/'?'inicio':route==='/articulos/:slug'?'articulo':route.slice(1);
  const page={key,name:sections.seo.title.split(' | ')[0],route,slug:key,sections:Object.entries(sections).map(([key,initialContent])=>({key,name:key,type:key,initialContent,fields:fields(initialContent)}))};
  const index=manifest.pages.findIndex(p=>p.route===route);if(index>=0)manifest.pages[index]=page;else manifest.pages.push(page);
}
manifest.pages=manifest.pages.filter(p=>p.route!=='/newsletter'||p.sections.length);
const nav=manifest.globals.find(g=>g.key==='institutional-navbar');
if(nav){nav.initialContent=data['/'].navbar;nav.fields=fields(data['/'].navbar);}
const landing=manifest.pages.find(p=>p.route==='/disena-tu-futuro'||p.route==='/diseno-de-carrera');
if(landing){
  landing.key='diseno-de-carrera';landing.name='Diseño de Carrera';landing.route='/diseno-de-carrera';landing.slug='disena-tu-futuro';
  landing.sections=landing.sections.filter(s=>!['testimonials','impact'].includes(s.key));
  const impact={eyebrow:'IMPACTO DEL PROGRAMA',title:'Resultados autodeclarados por quienes completaron el programa.',items:[
    {_id:'recommend',value:'100 %',label:'recomendaría el programa (35/35)'},{_id:'five',value:'80 %',label:'lo calificó con 5/5 (28/35)'},{_id:'clarity',value:'77 %',label:'reportó mayor claridad sobre su propósito profesional (27/35)'},{_id:'confidence',value:'60 %',label:'reportó mayor autoconfianza (21/35)'}
  ],note:'Resultados autodeclarados por 35 participantes en una encuesta voluntaria realizada en mayo de 2026. Los resultados individuales pueden variar.'};
  const section={key:'impact',name:'Impacto',type:'impact',initialContent:impact,fields:fields(impact)};
  const approachIndex=landing.sections.findIndex(s=>s.key==='approach');landing.sections.splice(Math.max(0,approachIndex),0,section);
  for(const key of ['hero','situations','approach','life','about','closing','footer']){
    const target=landing.sections.find(s=>s.key===key);if(target&&site[key]){target.initialContent=site[key];target.fields=fields(site[key]);}
  }
}
manifest.site.name='Claudia Sánchez Urencio';
for(const page of manifest.pages){
  const sectionKeys=new Set();
  for(const section of page.sections){
    if(sectionKeys.has(section.key))throw new Error(`Sección duplicada: ${page.route}/${section.key}`);sectionKeys.add(section.key);
    for(const field of section.fields){
      if(field.type!=='collection')continue;
      const items=field.path.split('.').reduce((value,part)=>value?.[part],section.initialContent);
      if(!Array.isArray(items))throw new Error(`Colección sin array: ${page.route}/${section.key}/${field.path}`);
      const ids=new Set();
      for(const item of items){
        if(!item||typeof item!=='object'||Array.isArray(item))throw new Error(`Colección con elemento no objeto: ${page.route}/${section.key}/${field.path}`);
        if(typeof item._id!=='string'||!/^[a-z][a-z0-9-]*$/.test(item._id)||ids.has(item._id))throw new Error(`_id inválido o duplicado: ${page.route}/${section.key}/${field.path}`);
        ids.add(item._id);
      }
    }
  }
}
fs.writeFileSync(path,JSON.stringify(manifest,null,2)+'\n');
const rows=['# Matriz de cobertura Eze CMS','','Fuente: content.json = initialContent. Contrato soportado del kit; validación local, sin sincronización ni persistencia remota comprobada.','','| Página | Sección | Campo | Tipo | Fuente / estado |','|---|---|---|---|---|'];
for(const [route] of Object.entries(data))for(const s of manifest.pages.find(p=>p.route===route).sections)for(const f of s.fields){rows.push(`| ${route} | ${s.key} | ${f.path} | ${f.type} | fallback + RPC / validado localmente |`);for(const sub of f.itemFields||[])rows.push(`| ${route} | ${s.key} | ${f.path}[] → ${sub.path} | ${sub.type} | panel de colección / preparado |`);}
rows.push('','Las colecciones se seleccionan completas, sin paths indexados. El panel documentado permite alta, baja y orden; falta comprobarlo contra el CMS real. ALT, metadatos, etiquetas de menú y estados ocultos se editan en el panel de campos.','', 'La ruta /articulos/:slug declara la plantilla; los artículos se leen desde /articulos > listado > items, nunca desde una RPC con slug interpolado.','', 'Gracias: confirmacion/proximos-pasos/volver quedan preparados; no se muestran hasta implementar una confirmación verificable y comprobar emails.');
fs.writeFileSync('docs/CMS-COVERAGE.md',rows.join('\n')+'\n');
console.log('Manifiesto y matriz generados localmente. Landing preservada.');
