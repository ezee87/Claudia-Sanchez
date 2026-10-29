// Secciones visibles, ocultas e inexistentes (Eze CMS): build, render inicial y actualización en el navegador. Sin red.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import * as snap from './cms-snapshot-plugin.mjs';

const manifest = JSON.parse(readFileSync('src/integration/eze-cms/claudia-sanchez.manifest.json', 'utf8'));
const allIds = manifest.pages.flatMap((p) => p.sections.map((s) => `${p.route}::${s.key}`));
const split = (id) => { const i = id.lastIndexOf('::'); return [id.slice(0, i), id.slice(i + 2)]; };
const json = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });

// ───────── Build ─────────
function fakeSupabase(visibility = {}, { missing = [], extraRows = [], noContent = [] } = {}) {
  const calls = [];
  const rows = allIds.filter((id) => !missing.includes(id)).map((id) => {
    const [page_route, section_key] = split(id);
    const row = { page_route, section_key, visible: true };
    if (id in visibility) { if (visibility[id] === undefined) delete row.visible; else row.visible = visibility[id]; }
    return row;
  });
  const fetchImpl = async (url, init) => {
    const fn = url.split('/rpc/')[1]; const args = JSON.parse(init.body); calls.push([fn, args]);
    if (fn === 'get_public_section_index') return json([...rows, ...extraRows]);
    if (fn === 'get_public_site_global') return json([{ content: { key: args.global_key } }]);
    const id = `${args.page_route}::${args.section_key}`;
    const row = rows.find((r) => `${r.page_route}::${r.section_key}` === id);
    // Igual que get_public_section: solo devuelve la fila si visible = true.
    return json(row && row.visible === true && !noContent.includes(id) ? [{ content: { id } }] : []);
  };
  return { fetchImpl, calls };
}
const build = (fake) => snap.fetchCmsSnapshot({ url: 'https://demo.supabase.co', key: 'sb_publishable_abc', manifest, fetchImpl: fake.fetchImpl, attempts: 2 });
const sectionReads = (calls) => calls.filter(([fn]) => fn === 'get_public_section').map(([, a]) => `${a.page_route}::${a.section_key}`);

{ // Todas visibles.
  const fake = fakeSupabase(); const s = await build(fake);
  assert.deepEqual(s.hidden, []); assert.equal(Object.keys(s.sections).length, allIds.length);
}
{ // Una oculta: el build termina, la registra y no pide su contenido.
  const fake = fakeSupabase({ '/::testimonios': false }); const s = await build(fake);
  assert.deepEqual(s.hidden, ['/::testimonios']); assert.ok(!('/::testimonios' in s.sections));
  assert.ok(!sectionReads(fake.calls).includes('/::testimonios'), 'No se lee el contenido de una sección oculta');
  assert.equal(Object.keys(s.sections).length, allIds.length - 1);
}
{ // Varias ocultas: false, null, sin columna y valores que no son el booleano true cuentan como ocultas.
  const visibility = { '/empresas::servicios': false, '/empresas::testimonios': null, '/contacto::formulario': undefined, '/diseno-de-carrera::closing': 'true', '/articulos::listado': 1 };
  const s = await build(fakeSupabase(visibility));
  assert.deepEqual(s.hidden, Object.keys(visibility).sort());
  for (const id of Object.keys(visibility)) assert.ok(!(id in s.sections), id);
}
{ // Vuelve a mostrarse: el siguiente build trae su contenido.
  const s = await build(fakeSupabase({ '/::testimonios': true }));
  assert.deepEqual(s.hidden, []); assert.deepEqual(s.sections['/::testimonios'], { id: '/::testimonios' });
}
{ // Filas del índice que el manifiesto no declara (secciones heredadas u otras páginas) no afectan.
  const s = await build(fakeSupabase({}, { extraRows: [{ page_route: '/', section_key: 'navbar', visible: false }] }));
  assert.deepEqual(s.hidden, []);
}
// Realmente faltante: error de integridad, aunque otras estén ocultas.
await assert.rejects(build(fakeSupabase({ '/::testimonios': false }, { missing: ['/::hero'] })), /\/::hero: no existe en Supabase/);
// Visible en el índice pero sin fila pública: inconsistencia, el build falla.
await assert.rejects(build(fakeSupabase({}, { noContent: ['/personas::hero'] })), /\/personas::hero: se esperaba 1 fila y llegaron 0/);
// Supabase no disponible o RPC sin instalar: el build falla y nunca supone secciones ocultas.
const failing = (response) => ({ fetchImpl: async () => { if (response instanceof Error) throw response; return response; } });
await assert.rejects(build(failing(new TypeError('fetch failed'))), /índice de secciones: fetch failed/);
await assert.rejects(build(failing(json({}, 503))), /índice de secciones: HTTP 503/);
await assert.rejects(build(failing(json({ code: 'PGRST202' }, 404))), /índice de secciones: HTTP 404/);
await assert.rejects(build(failing(json({ rows: [] }))), /índice de secciones: el índice de secciones no es una lista/);
await assert.rejects(build(failing(json([{ page_route: '/', visible: true }]))), /fila del índice de secciones no válida/);
await assert.rejects(build(failing(json([{ page_route: '/', section_key: 'hero', visible: true }, { page_route: '/', section_key: 'hero', visible: false }]))), /repite \/::hero/);
// Índice vacío (sitio inexistente o sin filas): todas las secciones faltan, ninguna se da por oculta.
await assert.rejects(build(fakeSupabase({}, { missing: allIds })), new RegExp(`\\(${allIds.length} de ${allIds.length + manifest.globals.length}\\)[^]*no existe en Supabase`));
console.log('OK build: visibles, una y varias ocultas, vuelta a mostrar, faltante real, índice inconsistente y Supabase no disponible.');

// ───────── Navegador (render inicial con el snapshot del build y actualización con la página abierta) ─────────
const hiddenAtBuild = ['/::testimonios', '/::seo', '/empresas::servicios', '/empresas::testimonios', '/contacto::formulario', '/diseno-de-carrera::career-testimonials', '/diseno-de-carrera::closing', '/articulos::listado'];
Object.assign(process.env, { VITE_CMS_LOCAL_ONLY: 'false', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' });
const testSnapshot = { name: 'test-snapshot', enforce: 'pre', resolveId: (id) => (id === 'virtual:eze-cms-snapshot' ? '\0test-snapshot' : null), load: (id) => (id === '\0test-snapshot' ? `export default ${JSON.stringify({ site: 'claudia-sanchez', sections: {}, hidden: hiddenAtBuild, globals: {} })};` : null) };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', plugins: [testSnapshot] });
try {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { MemoryRouter } = await import('react-router-dom');
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const { content } = await server.ssrLoadModule('/src/components/institutional/content.js');
  const { careerTestimonials } = await server.ssrLoadModule('/src/data/claudia/careerTestimonials.js');
  const runtime = await server.ssrLoadModule('/src/integration/eze-cms/cmsRuntime.ts');
  const visibility = await server.ssrLoadModule('/src/integration/eze-cms/cmsVisibility.ts');
  const client = await server.ssrLoadModule('/src/integration/eze-cms/cmsClient.ts');
  const { CmsEditable } = await server.ssrLoadModule('/src/integration/eze-cms/CmsEditable.tsx');
  const render = (route) => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App)));
  const order = (html, ids) => ids.map((id) => html.indexOf(`id="${id}"`));
  const increasing = (positions) => positions.every((p, i) => p >= 0 && (i === 0 || p > positions[i - 1]));

  // Primer render: las ocultas no aparecen (ni con el contenido local) y las visibles conservan su orden.
  let home = render('/');
  assert.ok(!home.includes('id="testimonios"') && !home.includes(content['/'].testimonios.items[0].quote), 'Sin testimonios ni su texto local');
  assert.ok(increasing(order(home, ['sobre-mi', 'servicios', 'enfoque', 'articulos', 'contacto'])), 'Orden de las visibles');
  assert.equal((home.match(/<h1[ >]/g) || []).length, 1);
  const empresas = render('/empresas');
  assert.ok(!empresas.includes('id="servicios"') && !empresas.includes('id="testimonios"'));
  assert.ok(increasing(order(empresas, ['hero', 'desafios', 'experiencia', 'proceso', 'contacto'])));
  const contacto = render('/contacto');
  assert.ok(!contacto.includes('<form') && contacto.includes('contact-alt'), 'Formulario oculto, contacto directo visible');
  const landing = render('/diseno-de-carrera');
  assert.ok(!landing.includes('id="testimonios"') && !landing.includes(careerTestimonials.items[0].quote), 'Sin testimonios de la landing');
  assert.ok(!landing.includes('href="#testimonios"'), 'Sin enlaces de navegación a la sección oculta');
  assert.ok(!landing.includes('data-rv="reserve"') && landing.includes('id="sobre-mi"'), 'Cierre oculto, Sobre mí visible');
  assert.ok(increasing(order(landing, ['inicio', 'situaciones', 'enfoque', 'sobre-mi'])));
  const articulos = render('/articulos');
  assert.ok(!articulos.includes('articles-listing') && articulos.includes('id="intro"'), 'Listado oculto, intro visible');
  assert.ok(render('/articulos/no-disponible').includes('article-detail'), 'El detalle de artículo sigue funcionando');
  for (const route of ['/personas', '/comunidad-y-experiencias', '/gracias', '/no-existe']) assert.equal((render(route).match(/<h1[ >]/g) || []).length, 1, route);
  const config = { siteSlug: 'claudia-sanchez', supabaseUrl: '', supabasePublishableKey: '' };
  const child = React.createElement('p', null, 'texto');
  assert.equal(CmsEditable({ config, pageRoute: '/', sectionKey: 'testimonios', fieldPath: 'title', children: child }), null, 'Campo de sección oculta: no se renderiza');
  assert.equal(CmsEditable({ config, pageRoute: '/', sectionKey: 'hero', fieldPath: 'title', children: child }), child);
  console.log('OK render inicial: secciones ocultas ausentes desde el primer render (sin fallback local), orden y páginas intactos.');

  // Con la página abierta: el índice oculta una sección visible y revela una oculta con su contenido remoto, en su posición.
  const site = 'claudia-sanchez';
  const reads = [];
  const readSection = async ({ pageRoute, sectionKey }) => {
    reads.push(`${pageRoute}::${sectionKey}`);
    if (sectionKey === 'testimonios' && pageRoute === '/') return { content: { title: 'Testimonios desde Eze CMS' }, error: null };
    if (pageRoute === '/empresas' && sectionKey === 'servicios') return { content: null, error: new Error('red caída') };
    return { content: null, error: null };
  };
  const index = (entries) => new Map(allIds.map((id) => [id, !hiddenAtBuild.includes(id)]).concat(entries));
  await runtime.applyCmsSectionIndex(site, index([['/::servicios', false], ['/::testimonios', true], ['/empresas::servicios', true], ['/empresas::testimonios', true]]), readSection);
  assert.ok(!reads.includes('/::hero'), 'Las secciones que ya estaban visibles no se vuelven a leer');
  home = render('/');
  assert.ok(!home.includes('id="servicios"'), 'Ocultada con la página abierta');
  assert.ok(home.includes('Testimonios desde Eze CMS') && !home.includes(content['/'].testimonios.title), 'Revelada con el contenido de Eze CMS, no con el local');
  assert.ok(increasing(order(home, ['sobre-mi', 'enfoque', 'testimonios', 'articulos', 'contacto'])), 'Recupera su posición original');
  assert.ok(visibility.isCmsSectionHidden(site, '/empresas', 'servicios'), 'Sin contenido legible (error) sigue oculta');
  assert.ok(visibility.isCmsSectionHidden(site, '/empresas', 'testimonios'), 'Sin fila pública sigue oculta');
  // Una sección ausente del índice no cambia de estado.
  await runtime.applyCmsSectionIndex(site, new Map([['/::hero', false]]), readSection);
  assert.ok(visibility.isCmsSectionHidden(site, '/', 'hero'));
  assert.ok(!visibility.isCmsSectionHidden(site, '/', 'testimonios') && !visibility.isCmsSectionHidden(site, '/', 'enfoque'), 'Las ausentes del índice conservan su estado');
  visibility.updateCmsSectionVisibility(site, new Map([['/::hero', true], ['/::servicios', true]]));
  // Supabase no disponible durante la navegación: el lector devuelve error (nunca un índice vacío) y nada cambia.
  const before = render('/');
  for (const rpc of [async () => { throw new TypeError('Failed to fetch'); }, async () => ({ data: null, error: { message: 'HTTP 503' } }), async () => ({ data: { rows: [] }, error: null }), async () => ({ data: [{ page_route: '/' }], error: null })]) {
    const result = await client.createPublicSectionIndexReader({ rpc })({ siteSlug: site });
    assert.equal(result.index, null); assert.ok(result.error instanceof Error);
  }
  assert.equal(render('/'), before, 'Sin índice no hay cambios de visibilidad');
  // Misma regla de visibilidad en el build y en el navegador.
  const sample = [{ page_route: '/', section_key: 'a', visible: true }, { page_route: '/', section_key: 'b', visible: false }, { page_route: '/', section_key: 'c', visible: null }, { page_route: '/', section_key: 'd' }, { page_route: '/x', section_key: 'e', visible: 'true' }];
  assert.deepEqual([...client.parseSectionIndex(sample)], [...snap.parseSectionIndex(sample)]);
  assert.deepEqual([...client.parseSectionIndex(sample)].filter(([, v]) => v).map(([id]) => id), ['/::a']);
  console.log('OK navegador: ocultar y volver a mostrar con la página abierta, sin fallback local; Supabase no disponible sin cambios.');

  // Aviso de visibilidad del preview de Eze CMS (EZE_CMS_UPDATE_SECTION_VISIBILITY).
  const notify = (data, read = async () => ({ content: null, error: null })) => runtime.applyPreviewSectionVisibility(site, data, read);
  const msg = (extra) => ({ type: 'EZE_CMS_UPDATE_SECTION_VISIBILITY', site, pageRoute: '/', sectionKey: 'enfoque', ...extra });
  assert.equal(await notify(msg({ visible: false })), true);
  assert.ok(!render('/').includes('id="enfoque"'), 'Ocultar desmonta la sección');
  assert.equal(await notify(msg({ visible: true, content: { title: 'Enfoque desde el preview' } })), true);
  home = render('/');
  assert.ok(home.includes('Enfoque desde el preview') && !home.includes(content['/'].enfoque.title), 'Mostrar usa el contenido del CMS, no el local');
  assert.ok(increasing(order(home, ['sobre-mi', 'servicios', 'enfoque', 'testimonios', 'articulos'])), 'Vuelve a su posición');
  // Sin contenido en el aviso: se lee el público; si no hay, sigue oculta.
  await notify(msg({ sectionKey: 'servicios', visible: false }));
  assert.equal(await notify(msg({ sectionKey: 'servicios', visible: true }), async () => ({ content: null, error: new Error('red caída') })), false);
  assert.ok(visibility.isCmsSectionHidden(site, '/', 'servicios'), 'Sin contenido disponible no se muestra el fallback');
  assert.equal(await notify(msg({ sectionKey: 'servicios', visible: true }), async () => ({ content: { title: 'Servicios públicos' }, error: null })), true);
  assert.ok(render('/').includes('Servicios públicos'));
  // Avisos consecutivos: si llega «ocultar» mientras «mostrar» espera su contenido, gana el último.
  let release; const slow = new Promise((resolve) => { release = resolve; });
  const showing = notify(msg({ sectionKey: 'contacto', visible: true }), () => slow);
  await notify(msg({ sectionKey: 'contacto', visible: false }));
  release({ content: { title: 'tarde' }, error: null });
  assert.equal(await showing, false); assert.ok(visibility.isCmsSectionHidden(site, '/', 'contacto'));
  await notify(msg({ sectionKey: 'contacto', visible: true, content: { title: 'Contacto' } }));
  // Mensajes inválidos u otro sitio: se ignoran.
  const snapshotBefore = render('/');
  for (const bad of [null, 'texto', msg({ visible: 'false' }), msg({ site: 'otro-sitio', visible: false }), msg({ type: 'EZE_CMS_UPDATE_SECTION', visible: false }), msg({ sectionKey: 7, visible: false })]) assert.equal(await notify(bad), false);
  assert.equal(render('/'), snapshotBefore);
  console.log('OK preview: ocultar y mostrar al instante con el contenido del CMS, avisos consecutivos y mensajes inválidos ignorados.');
} finally { await server.close(); }
