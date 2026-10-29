// Paridad entre el render local de React (fallbacks efectivos) y el manifiesto Eze CMS. Solo lectura local.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const manifest = JSON.parse(fs.readFileSync('src/integration/eze-cms/claudia-sanchez.manifest.json', 'utf8'));
const CMS_VALIDATOR = path.resolve('../CMS_Ezequiel/src/lib/siteManifest.ts');
const valueAt = (value, fieldPath) => fieldPath.split('.').reduce((current, part) => current?.[part], value);

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { content } = await server.ssrLoadModule('/src/components/institutional/content.js');
  const { mergeCmsContent } = await server.ssrLoadModule('/src/integration/eze-cms/useCmsSection.ts');
  const { resolveCmsLink } = await server.ssrLoadModule('/src/integration/eze-cms/cmsLink.js');
  const { LANDING_ROUTE, landingSections, landingInitialContent } = await server.ssrLoadModule('/src/data/claudia/landingCms.js');

  assert.equal(manifest.version, 1); assert.equal(manifest.site.key, 'claudia-sanchez');
  assert.equal(new Set(manifest.pages.map(p => p.key)).size, manifest.pages.length, 'page.key duplicada');
  assert.equal(new Set(manifest.pages.map(p => p.slug)).size, manifest.pages.length, 'page.slug duplicado');

  // Globales: mismos valores que lee Layout.jsx y nunca menos campos que los publicados (la sync los quitaría del sitio).
  const expectedGlobals = { 'institutional-navbar': content['/'].navbar, 'institutional-footer': content['/'].footer };
  const publishedGlobalFields = {
    'institutional-navbar': ['brand', 'home', 'about', 'servicesLabel', 'people', 'business', 'community', 'articles', 'contact', 'openLabel', 'closeLabel', 'skipLabel'],
    'institutional-footer': ['brand', 'line', 'linkedin'],
  };
  assert.equal(new Set(manifest.globals.map(g => g.key)).size, manifest.globals.length);
  for (const [key, fallback] of Object.entries(expectedGlobals)) {
    const group = manifest.globals.find(g => g.key === key); assert.ok(group, key); assert.equal(group.published, true); assert.deepEqual(group.initialContent, fallback);
    assert.equal(new Set(group.fields.map(f => f.path)).size, group.fields.length);
    for (const required of publishedGlobalFields[key]) assert.ok(group.fields.some(f => f.path === required), `El global ${key} perdería el campo ${required}`);
    for (const [fieldPath, value] of Object.entries(fallback)) {
      const field = group.fields.find(f => f.path === fieldPath); assert.ok(field, `${key}/${fieldPath}`); assert.ok(['string', 'number', 'image', 'link'].includes(field.type));
      if (value && typeof value === 'object') { assert.equal(field.type, 'link'); assert.ok(value.label); assert.ok(value.href); }
    }
  }

  // Páginas institucionales: initialContent idéntico al fallback efectivo (content.js, incluidos los hrefs de WhatsApp).
  let count = 0;
  for (const [route, sections] of Object.entries(content)) {
    const page = manifest.pages.find(p => p.route === route); assert.ok(page, route);
    for (const [key, fallback] of Object.entries(sections)) {
      const section = page.sections.find(s => s.key === key);
      if (route === '/' && ['navbar', 'footer'].includes(key)) { assert.equal(section, undefined, `/ › ${key} duplica el global`); continue; }
      assert.ok(section, `${route}/${key}`); assert.deepEqual(section.initialContent, fallback, `${route}/${key}`);
      assert.equal(new Set(section.fields.map(f => f.path)).size, section.fields.length);
      for (const [fieldPath, value] of Object.entries(fallback)) {
        const field = section.fields.find(f => f.path === fieldPath || f.path.startsWith(`${fieldPath}.`)); assert.ok(field, `${route}/${key}/${fieldPath}`); count++;
        if (Array.isArray(value) && value.some(item => item && typeof item === 'object')) {
          assert.equal(field.type, 'collection'); assert.equal(new Set(value.map(i => i._id)).size, value.length);
          for (const item of value) { assert.ok(item._id); for (const k of Object.keys(item).filter(k => k !== '_id')) assert.ok(field.itemFields.some(f => f.path === k), `${route}/${key}/${fieldPath}[]/${k}`); }
        }
        if (typeof value === 'string') assert.ok(!/\*\*|Nota editorial|PROVISIONAL|Presentación \(`/i.test(value), `${route}/${key}/${fieldPath}`);
      }
    }
  }
  assert.deepEqual(content['/personas'].servicios.items.map(i => i._id), manifest.pages.find(p => p.route === '/personas').sections.find(s => s.key === 'servicios').initialContent.items.map(i => i._id));
  for (const item of manifest.pages.find(p => p.route === '/personas').sections.find(s => s.key === 'servicios').initialContent.items) assert.ok(!item.href.startsWith('/contacto?'), `Personas › ${item._id} conserva un href antiguo`);
  assert.deepEqual(manifest.pages.find(p => p.route === '/empresas').sections.find(s => s.key === 'testimonios').initialContent.items.map(i => i._id), ['ana-cristina', 'pedro-fondevila', 'ricardo-schmidt'], 'Orden definitivo de Empresas');
  assert.ok(manifest.pages.find(p => p.route === '/comunidad-y-experiencias'), 'Falta Comunidad y Experiencias');
  assert.equal(manifest.globals.find(g => g.key === 'institutional-navbar').initialContent.community.href, '/comunidad-y-experiencias');

  // Landing: una única página, con clave y slug definitivos, y cada sección igual a lo que muestra React.
  const landingPages = manifest.pages.filter(p => /dise[nñ][oa]/i.test(`${p.key} ${p.route} ${p.slug}`));
  assert.equal(landingPages.length, 1, 'Debe existir una sola página de Diseño de Carrera');
  const landing = landingPages[0];
  assert.deepEqual([landing.key, landing.slug, landing.route], ['diseno-de-carrera', 'diseno-de-carrera', LANDING_ROUTE]);
  assert.deepEqual(landing.sections.map(s => s.key), landingSections.map(s => s.key));
  for (const forbidden of ['impact', 'testimonials']) assert.ok(!landing.sections.some(s => s.key === forbidden), `La landing no debe declarar ${forbidden}`);
  for (const spec of landingSections) {
    const section = landing.sections.find(s => s.key === spec.key);
    assert.deepEqual(section.initialContent, landingInitialContent(spec), `landing/${spec.key}`);
    // Con initialContent como contenido remoto, cada valor que React muestra coincide con el render local.
    const remote = mergeCmsContent(spec.fallback, section.initialContent);
    for (const [key, local] of Object.entries(spec.fallback)) {
      if ((spec.obsolete || []).includes(key)) continue;
      const linkDefault = spec.links?.[key];
      if (linkDefault) assert.deepEqual(resolveCmsLink(remote[key], linkDefault), resolveCmsLink(local, linkDefault), `landing/${spec.key}/${key}`);
      else assert.deepEqual(remote[key], local, `landing/${spec.key}/${key}`);
    }
    for (const [key, link] of Object.entries(spec.links || {})) assert.deepEqual(resolveCmsLink(remote[key], link), resolveCmsLink(spec.fallback[key], link), `landing/${spec.key}/${key}`);
    for (const key of Object.keys(section.initialContent)) assert.ok(section.fields.some(f => f.path === key || f.path.startsWith(`${key}.`)), `landing/${spec.key}/${key} sin declarar`);
    for (const field of section.fields) assert.notEqual(valueAt(section.initialContent, field.path), undefined, `landing/${spec.key}/${field.path} sin valor inicial`);
  }
  assert.deepEqual(landing.sections.find(s => s.key === 'career-testimonials').initialContent.items.map(i => i._id), ['aldo-barrios', 'jose-herrera', 'manuel-mirabent']);
  assert.ok(!manifest.pages.some(p => p.route === '/disena-tu-futuro'), 'La página antigua no debe estar en el manifiesto');

  // Selección contextual: cada campo/colección que la landing marca como editable existe en el manifiesto.
  const dynamicSections = { 'Hero.jsx': { '{SECTION_KEY}': 'hero' }, 'LifeDiagram.jsx': { '{cmsSection}': 'life' } };
  const unquote = (raw, file) => raw.startsWith('"') ? raw.slice(1, -1) : dynamicSections[file]?.[raw] ?? raw.replace(/^\{`|`\}$/g, '').replace(/\$\{index\}/g, '0');
  let editables = 0;
  // Testimonials.jsx no se renderiza; SectionHead.jsx se verifica a través de cada `<SectionHead cmsSection>`.
  for (const file of fs.readdirSync('src/components/claudia').filter(f => f.endsWith('.jsx') && !['Testimonials.jsx', 'SectionHead.jsx'].includes(f))) {
    const source = fs.readFileSync(path.join('src/components/claudia', file), 'utf8');
    const targets = [...source.matchAll(/sectionKey=("[^"]+"|\{[^}]+\})\s+(fieldPath|collectionPath)=("[^"]+"|\{`[^`]+`\})/g)].map(m => [unquote(m[1], file), m[2], unquote(m[3], file)]);
    for (const [, sectionKey] of source.matchAll(/<SectionHead\b[^>]*\bcmsSection="([^"]+)"/g)) targets.push([sectionKey, 'fieldPath', 'eyebrow'], [sectionKey, 'fieldPath', 'title']);
    for (const [sectionKey, kind, fieldPath] of targets) {
      const section = landing.sections.find(s => s.key === sectionKey); assert.ok(section, `${file}: sección ${sectionKey} no declarada`);
      if (kind === 'collectionPath') assert.ok(section.fields.some(f => f.path === fieldPath && f.type === 'collection'), `${file}: colección ${sectionKey}/${fieldPath} no declarada`);
      else assert.notEqual(valueAt(section.initialContent, fieldPath), undefined, `${file}: ${sectionKey}/${fieldPath} no existe en el manifiesto`);
      editables++;
    }
  }

  // Lo mismo para las páginas institucionales y los globales: cada `Field`/`GlobalField` con ruta literal debe existir.
  const pageOf = route => manifest.pages.find(p => p.route === route);
  const institutionalFiles = {
    'src/pages/HomePage/HomePage.jsx': { route: '/', single: 'sobre-mi' },
    'src/pages/PersonasPage/PersonasPage.jsx': { route: '/personas' },
    'src/pages/EmpresasPage/EmpresasPage.jsx': { route: '/empresas' },
    'src/pages/ComunidadPage/ComunidadPage.jsx': { route: '/comunidad-y-experiencias' },
    'src/pages/ContactoPage/ContactoPage.jsx': { route: '/contacto', single: 'intro' },
    'src/components/institutional/ContactForm.jsx': { route: '/contacto', single: 'formulario', helpers: { directField: 'contacto-directo' } },
    'src/components/institutional/articles.jsx': { route: '/articulos/:slug', helpers: { listingField: ['/articulos', 'listado'] }, pair: 'detailField' },
    'src/components/institutional/Layout.jsx': {},
  };
  let institutionalEditables = 0;
  for (const [file, rule] of Object.entries(institutionalFiles)) {
    const source = fs.readFileSync(file, 'utf8');
    const targets = [];
    for (const m of source.matchAll(/<Field route=(?:"([^"]+)"|\{(?:ROUTE|route)\}) section="([^"]+)" path="([^"]+)"/g)) targets.push([m[1] ?? rule.route, m[2], m[3]]);
    for (const m of source.matchAll(new RegExp(`\\b${rule.pair ?? 'field'}\\('([^']+)',\\s*'([^']+)'`, 'g'))) targets.push([rule.route, m[1], m[2]]);
    if (rule.single) for (const m of source.matchAll(/\bfield\('([^']+)',\s*</g)) targets.push([rule.route, rule.single, m[1]]);
    for (const [helper, where] of Object.entries(rule.helpers || {})) for (const m of source.matchAll(new RegExp(`\\b${helper}\\('([^']+)',\\s*<`, 'g'))) targets.push(Array.isArray(where) ? [...where, m[1]] : [rule.route, where, m[1]]);
    for (const [route, sectionKey, fieldPath] of targets) {
      const section = pageOf(route)?.sections.find(s => s.key === sectionKey);
      assert.ok(section, `${file}: sección ${route} › ${sectionKey} no declarada`);
      assert.notEqual(valueAt(section.initialContent, fieldPath), undefined, `${file}: ${route} › ${sectionKey}/${fieldPath} no existe en el manifiesto`);
      assert.ok(section.fields.some(f => f.path === fieldPath || fieldPath.startsWith(`${f.path}.`)), `${file}: ${route} › ${sectionKey}/${fieldPath} sin declarar`);
      institutionalEditables++;
    }
    for (const m of source.matchAll(/<GlobalField groupKey="([^"]+)" path="([^"]+)"/g)) {
      const group = manifest.globals.find(g => g.key === m[1]);
      assert.ok(group?.fields.some(f => f.path === m[2]), `${file}: global ${m[1]}/${m[2]} no declarado`);
      institutionalEditables++;
    }
  }
  assert.ok(institutionalEditables > 80, `Se esperaban más editables institucionales detectados (${institutionalEditables})`);
  editables += institutionalEditables;

  // Validador real del CMS (mismo código que usa «Sincronizar manifiesto»), si el proyecto está disponible.
  if (fs.existsSync(CMS_VALIDATOR)) {
    const { validateSiteManifest } = await server.ssrLoadModule(CMS_VALIDATOR);
    const result = validateSiteManifest(manifest);
    assert.ok(result.ok, `El CMS rechazaría el manifiesto:\n${(result.errors || []).join('\n')}`);
    console.log('OK: el validador de Eze CMS acepta el manifiesto.');
  } else console.warn(`AVISO: no se encontró ${CMS_VALIDATOR}; se omite la validación del CMS.`);

  assert.equal(content['/articulos'].listado.items.length, 0, 'No invented published articles');
  assert.equal(content['/personas'].servicios.items.length, 3); assert.equal(content['/empresas'].servicios.items.length, 2);
  assert.equal(content['/'].testimonios.items.length, 3); assert.equal(content['/personas'].testimonios.items.length, 3); assert.equal(content['/empresas'].testimonios.items.length, 3);
  assert.equal(content['/personas'].situaciones.items.length, 4); assert.equal(content['/empresas'].desafios.items.length, 2);
  console.log(`OK: ${manifest.pages.length} páginas, ${manifest.globals.length} globales, ${count} campos institucionales, ${landingSections.length} secciones de la landing y ${editables} editables con paridad.`);
} finally {
  await server.close();
}
