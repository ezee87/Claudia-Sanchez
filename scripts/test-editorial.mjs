import assert from 'node:assert/strict';
import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const React=await import('react');
 const {renderToStaticMarkup}=await import('react-dom/server');
 const {MemoryRouter}=await import('react-router-dom');
 const {default:App}=await server.ssrLoadModule('/src/App.jsx');
 const {resolveApproachSteps}=await server.ssrLoadModule('/src/pages/HomePage/HomePage.jsx');
 const {safeHref,publishedArticles,content}=await server.ssrLoadModule('/src/components/institutional/content.js');
 const {mergeCmsContent}=await server.ssrLoadModule('/src/integration/eze-cms/useCmsSection.ts');
 const {resolveBusinessTestimonials,splitServiceDescription}=await server.ssrLoadModule('/src/pages/EmpresasPage/content.js');
 for(const route of ['/','/personas','/empresas','/comunidad-y-experiencias','/diseno-de-carrera','/contacto','/contacto?tipo=empresa&servicio=coaching-ejecutivo','/articulos','/articulos/no-disponible','/gracias','/no-existe']){
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:[route]},React.createElement(App)));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,route);
  assert.ok(html.includes('Claudia Sánchez Urencio'));
  assert.ok(!html.includes('Página pendiente de desarrollo'));
  if(route==='/gracias')assert.ok(!html.includes('Tu reserva se realizó correctamente'));
  if(route.includes('tipo=empresa'))assert.ok(html.includes('id="contact-company"'));
  if(route==='/contacto')assert.ok(!html.includes('id="contact-company"'));
  if(route==='/empresas'){
   assert.ok(!html.includes('Testimonios pendientes de verificación'));
   for(const item of content['/empresas'].testimonios.items){
    assert.ok(html.includes(item.author));
    assert.ok(html.includes(item.quote));
   }
   assert.ok(html.includes('lang="en"'));
   assert.ok(html.includes('Extracto de recomendación'));
   assert.ok(html.includes('aria-hidden="true">RS</span>'));
   assert.ok(!html.includes('Cargo no disponible'));
   for(const item of content['/empresas'].servicios.items)assert.ok(html.includes(`href="${item.href.replace(/&/g,"&amp;")}"`));
   assert.ok(html.includes('href="#servicios"'));
  }
  if(route==='/'){
   for(const text of ['Anticipación','Estrategia','Ecosistema','Leer el contexto, identificar tendencias','Transformar la reflexión en dirección','Conectar personas, ideas y recursos'])assert.ok(html.includes(text),`Falta etapa de enfoque en DOM: ${text}`);
   assert.equal((html.match(/class="[^\"]*pillarIcon[^\"]*"/g)||[]).length,3,'Deben renderizarse tres iconos de enfoque');
  }
  console.log('SSR fallback OK:',route);
 }
 for(const url of ['javascript:alert(1)','data:text/html,hi','//evil.com','/\\evil.com','https:\n//evil.com',''])assert.equal(safeHref(url,'/contacto'),'/contacto');
 for(const url of ['/personas','#servicios','https://calendly.com/test','mailto:a@example.com','tel:+123'])assert.equal(safeHref(url),url);
 const fallback=content['/'].hero;
 const business=content['/empresas'].testimonios;
 assert.equal(resolveBusinessTestimonials({title:'Testimonios pendientes de verificación',items:[]},business),business);
 assert.equal(resolveBusinessTestimonials({...business,paragraph1:'Se publicarán cuando estén disponibles sus textos completos.'},business),business);
 const remoteBusiness=mergeCmsContent(business,{title:'Experiencias editadas',items:[{...business.items[2],quote:'Recomendación editada'}]});
 assert.equal(resolveBusinessTestimonials(remoteBusiness,business),remoteBusiness,'Las ediciones válidas del CMS deben conservarse');
 assert.deepEqual(resolveBusinessTestimonials(mergeCmsContent(business,{items:[]}),business).items,[],'Se respeta la baja intencional de la colección');
 assert.equal(splitServiceDescription(content['/empresas'].servicios.items[0].description).included.length,5);
 assert.equal(splitServiceDescription(content['/empresas'].servicios.items[1].description).included.length,5);
 assert.deepEqual(splitServiceDescription('Contenido nuevo sin lista'),{audience:['Contenido nuevo sin lista'],included:[]});
 const updated=mergeCmsContent(fallback,{title:'Título editado',paragraph1:'Párrafo editado',cta:{label:'Consultar',href:'/contacto'},image:'/replacement.png',alt:'ALT editado'});
 assert.equal(updated.title,'Título editado');assert.equal(updated.paragraph1,'Párrafo editado');assert.equal(updated.cta.href,'/contacto');assert.equal(updated.cta.label,'Consultar');assert.equal(updated.image,'/replacement.png');assert.equal(updated.alt,'ALT editado');assert.equal(updated.paragraph2,fallback.paragraph2);
 assert.deepEqual(mergeCmsContent(fallback,{title:null,image:4}),fallback);
 const approachFallback=content['/'].enfoque.steps;
 assert.equal(resolveApproachSteps(undefined,approachFallback).length,3);
 assert.equal(resolveApproachSteps([],approachFallback).length,3);
 assert.deepEqual(resolveApproachSteps([{...approachFallback[1],title:'Estrategia editada'}],approachFallback).map(step=>step.title),['Estrategia editada','Anticipación','Ecosistema']);
 const list=content['/personas'].servicios.items;
 for(const values of [[],list.slice(1),[...list].reverse(),[...list,{...list[0],_id:'new'}]])assert.deepEqual(mergeCmsContent({items:list},{items:values}).items,values);
 const articles=[{_id:'a',slug:'a',title:'A',body:'Original',publishedAt:'2026-09-17',status:'published'},{_id:'b',slug:'b',title:'B',body:'Original',publishedAt:'2026-10-01',status:'published'}];
 assert.deepEqual(publishedArticles([...articles,{...articles[0],_id:'duplicate'}, {...articles[0],_id:'draft',slug:'draft',status:'draft'}, {...articles[0],_id:'empty',slug:'empty',body:''}]).map(a=>a.slug),['b','a']);
 console.log('OK: enlaces seguros, actualización CMS de texto/link/imagen/ALT, reemplazo/alta/baja/orden de arrays, publicación y orden de artículos.');
 const {previewIsAuthorized,CmsEditable}=await server.ssrLoadModule('/src/integration/eze-cms/CmsEditable.tsx');
 const {CmsEditableCollection}=await server.ssrLoadModule('/src/integration/eze-cms/CmsEditableCollection.tsx');
 const {CmsEditableGlobal}=await server.ssrLoadModule('/src/integration/eze-cms/CmsEditableGlobal.tsx');
 const sent=[];const parent={postMessage:(message,origin)=>sent.push({message,origin})};
 const config={siteSlug:'claudia-sanchez',supabaseUrl:'',supabasePublishableKey:'',cmsPreviewOrigin:'https://cms.example.test'};
 globalThis.window={parent,location:{search:'?cmsPreview=true'}};
 globalThis.document={referrer:'https://cms.example.test/editor'};
 assert.equal(previewIsAuthorized(config),true);
 const child=React.createElement('a',{href:'/contacto'},'Consultar');
 const editable=CmsEditable({config,pageRoute:'/',sectionKey:'hero',fieldPath:'cta',children:child});
 let prevented=false;editable.props.onClick({preventDefault(){prevented=true;},stopPropagation(){}});
 assert.ok(prevented);assert.deepEqual(sent[0],{message:{type:'EZE_CMS_SELECT_FIELD',site:'claudia-sanchez',pageRoute:'/',sectionKey:'hero',fieldPath:'cta'},origin:'https://cms.example.test'});
 const collectionChild=React.createElement('article',null,'Testimonio');
 globalThis.Element=class Element {};
 const collection=CmsEditableCollection({config,pageRoute:'/personas',sectionKey:'testimonios',collectionPath:'items',children:collectionChild});
 collection.props.onClick({target:null,preventDefault(){},stopPropagation(){}});
 const item=CmsEditableCollection({config,pageRoute:'/personas',sectionKey:'testimonios',collectionPath:'items',itemId:'item-1',children:collectionChild});
 item.props.onClick({target:null,preventDefault(){},stopPropagation(){}});
 assert.deepEqual(sent.slice(1),[
  {message:{type:'EZE_CMS_SELECT_COLLECTION',site:'claudia-sanchez',pageRoute:'/personas',sectionKey:'testimonios',collectionPath:'items'},origin:'https://cms.example.test'},
  {message:{type:'EZE_CMS_SELECT_COLLECTION',site:'claudia-sanchez',pageRoute:'/personas',sectionKey:'testimonios',collectionPath:'items',itemId:'item-1'},origin:'https://cms.example.test'},
 ]);
 const globalLink=CmsEditableGlobal({config,groupKey:'institutional-navbar',fieldPath:'contact',children:child});
 globalLink.props.onClick({preventDefault(){},stopPropagation(){}});
 assert.deepEqual(sent[3],{message:{type:'EZE_CMS_SELECT_GLOBAL',site:'claudia-sanchez',groupKey:'institutional-navbar',fieldPath:'contact'},origin:'https://cms.example.test'});
 globalThis.document.referrer='https://untrusted.example.test';assert.equal(previewIsAuthorized(config),false);assert.equal(CmsEditable({config,pageRoute:'/',sectionKey:'hero',fieldPath:'cta',children:child}),child);
 // Varios orígenes autorizados (CMS local y publicado): el targetOrigin es siempre el origen exacto que embebe la página.
 const {parseCmsPreviewOrigins}=await server.ssrLoadModule('/src/integration/eze-cms/cmsOrigins.ts');
 const {authorizedPreviewOrigin}=await server.ssrLoadModule('/src/integration/eze-cms/CmsEditable.tsx');
 assert.deepEqual(parseCmsPreviewOrigins(' http://localhost:5173 , https://cms.example.test,https://cms.example.test/editor,javascript:alert(1),*,https://cms.example.test'),['http://localhost:5173','https://cms.example.test']);
 assert.deepEqual(parseCmsPreviewOrigins(undefined),[]);
 const multi={...config,cmsPreviewOrigin:undefined,cmsPreviewOrigins:parseCmsPreviewOrigins('http://localhost:5173,https://cms.example.test')};
 globalThis.document.referrer='http://localhost:5173/';assert.equal(authorizedPreviewOrigin(multi),'http://localhost:5173');
 sent.length=0;CmsEditable({config:multi,pageRoute:'/diseno-de-carrera',sectionKey:'hero',fieldPath:'title',children:child}).props.onClick({preventDefault(){},stopPropagation(){}});
 assert.equal(sent[0].origin,'http://localhost:5173');
 for(const referrer of ['https://cms.example.test.evil.test/','http://localhost:5174/','https://localhost:5173/','']){globalThis.document.referrer=referrer;assert.equal(authorizedPreviewOrigin(multi),null,referrer);}
 globalThis.document.referrer='https://cms.example.test/';globalThis.window.location.search='';assert.equal(authorizedPreviewOrigin(multi),null,'Sin ?cmsPreview=true no hay modo preview');
 globalThis.window.location.search='?cmsPreview=true';globalThis.window.parent=globalThis.window;assert.equal(authorizedPreviewOrigin(multi),null,'Fuera de un iframe no hay modo preview');
 assert.equal(authorizedPreviewOrigin({...config,cmsPreviewOrigin:undefined,cmsPreviewOrigins:[]}),null,'Sin orígenes configurados no hay modo preview');
 delete globalThis.window;delete globalThis.document;delete globalThis.Element;
 const {resolveCmsLocalOnly}=await server.ssrLoadModule('/src/integration/eze-cms/cmsMode.ts');
 for(const [value,dev,expected] of [['true',false,true],[' TRUE ',false,true],['false',true,false],[undefined,true,true],[undefined,false,false],['',false,false],['1',false,false]])assert.equal(resolveCmsLocalOnly(value,dev),expected,`VITE_CMS_LOCAL_ONLY=${value} dev=${dev}`);
 console.log('OK: VITE_CMS_LOCAL_ONLY fuerza contenido local (true), Eze CMS (false) o el modo por entorno (sin definir).');
 console.log('OK: selección preview de campos, colecciones, items y globales; targetOrigin explícito, lista de orígenes exactos y rechazo de origen no autorizado (simulación local).');
}finally{await server.close();}

