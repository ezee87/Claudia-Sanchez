// Genera el manifiesto Eze CMS de Claudia desde los mismos fallbacks que renderiza React; nunca lee el manifiesto
// anterior, así que no puede arrastrar contenido obsoleto. No sincroniza ni escribe nada remoto.
// Uso: `npm run cms:manifest` escribe los archivos · `--check` solo compara y falla si el archivo versionado difiere.
import fs from 'node:fs';
import { createServer } from 'vite';

const MANIFEST_PATH = 'src/integration/eze-cms/claudia-sanchez.manifest.json';
const COVERAGE_PATH = 'docs/CMS-COVERAGE.md';
const check = process.argv.includes('--check');

// Identidad de las páginas en el CMS: `key` es permanente (la sync la usa para encontrar la página).
const PAGES = {
  '/': { key: 'inicio', name: 'Inicio' },
  '/personas': { key: 'personas', name: 'Personas' },
  '/empresas': { key: 'empresas', name: 'Empresas' },
  '/comunidad-y-experiencias': { key: 'comunidad-y-experiencias', name: 'Comunidad y Experiencias' },
  '/contacto': { key: 'contacto', name: 'Contacto' },
  '/articulos': { key: 'articulos', name: 'Artículos' },
  '/articulos/:slug': { key: 'articulo', name: 'Artículo' },
  '/gracias': { key: 'gracias', name: 'Gracias' },
  '/404': { key: '404', name: 'Página no encontrada' },
};
// La página de Inicio no declara `navbar` ni `footer`: React lee los globales institucionales.
const GLOBAL_SECTIONS = { '/': ['navbar', 'footer'] };

const COMMON_LABELS = { eyebrow: 'Antetítulo', title: 'Título', closing: 'Cierre', ctaLink: 'Botón de reserva' };
const LANDING_SCHEMA = {
  hero: { name: 'Hero', type: 'hero', labels: { highlightedTitle: 'Título destacado', description: 'Descripción', complement: 'Complemento', portrait: 'Retrato (también en Sobre mí)' }, required: ['ctaLink'] },
  situations: { name: 'El siguiente movimiento', type: 'content', labels: { intro: 'Introducción (cada línea se muestra por separado)', items: 'Situaciones', number: 'Número', label: 'Etiqueta', text: 'Texto', closing: 'Cierre (también al pie del menú móvil)' }, required: ['ctaLink'] },
  'career-testimonials': { name: 'Testimonios', type: 'testimonials', labels: { subtitle: 'Subtítulo', items: 'Testimonios', author: 'Autor', role: 'Cargo', quote: 'Cita textual', image: 'Foto', alt: 'Texto alternativo', lang: 'Idioma de la cita (es/en)', sourceLabel: 'Etiqueta de la fuente', linkedinUrl: 'Enlace de la recomendación' }, required: ['ctaLink'] },
  approach: { name: 'Cómo trabajo', type: 'process', labels: { intro: 'Introducción (línea en blanco = párrafo nuevo)', steps: 'Etapas', number: 'Número', label: 'Etiqueta', text: 'Texto' } },
  life: { name: 'Modelo L.I.F.E.', type: 'method', labels: { intro: 'Introducción', instruction: 'Instrucción', hubLabel: 'Centro del diagrama', dimensions: 'Dimensiones', id: 'Identificador técnico (no modificar)', label: 'Etiqueta', text: 'Texto', closing: 'Cierre (cada línea se muestra por separado)' } },
  about: { name: 'Sobre mí', type: 'about', labels: { 'paragraphs.0': 'Párrafo 1', 'paragraphs.1': 'Párrafo 2', 'paragraphs.2': 'Párrafo 3', facts: 'Datos', value: 'Valor', label: 'Etiqueta' } },
  closing: { name: 'Cierre y reserva', type: 'cta', labels: { text: 'Texto' }, required: ['ctaLink'] },
  'site-header': { name: 'Navegación principal', type: 'header', labels: { brandLink: 'Marca', navLink0: 'Enlace 1', navLink1: 'Enlace 2', navLink2: 'Enlace 3', navLink3: 'Enlace 4', ctaLink: 'Botón de reserva' }, keys: { brandLink: 'brand-link', navLink0: 'nav-0', navLink1: 'nav-1', navLink2: 'nav-2', navLink3: 'nav-3', ctaLink: 'cta-link' }, required: ['brandLink', 'navLink0', 'navLink1', 'navLink2', 'navLink3', 'ctaLink'] },
  'site-footer': { name: 'Pie de página', type: 'footer', labels: { brand: 'Marca', line: 'Especialidad', description: 'Descripción', copyright: 'Copyright', exploreHeading: 'Título de navegación', connectHeading: 'Título de contacto', homeLink: 'Inicio', navLink0: 'Enlace 1', navLink1: 'Enlace 2', navLink2: 'Enlace 3', navLink3: 'Enlace 4', linkedinLink: 'LinkedIn', calendlyLink: 'Calendly' }, keys: { homeLink: 'home-link', navLink0: 'nav-0', navLink1: 'nav-1', navLink2: 'nav-2', navLink3: 'nav-3', linkedinLink: 'linkedin-link', calendlyLink: 'calendly-link' }, required: ['homeLink', 'navLink0', 'navLink1', 'navLink2', 'navLink3', 'linkedinLink', 'calendlyLink'] },
  seo: { name: 'SEO', type: 'seo', labels: { title: 'Título de la pestaña', description: 'Meta descripción' } },
};

// Texto que no debe volver a publicarse nunca (páginas, enlaces, nombres y secciones retirados).
const OBSOLETE_PATTERNS = [
  /disena-tu-futuro/, /Diseña tu futuro/, /Sanchez Urencio/, /"#life"/, /titleLines/, /accentFrom/, /"key": "impact"/,
  /"key": "testimonials"/, /Jorge/, /Lucía López/, /Fabián Fuentes/, /Santiago Porrero/, /Alejandra García/, /servicio=(transicion-carrera|coaching-ejecutivo)/,
];

const article = { slug: '', title: '', publishedAt: '', cover: '', alt: '', body: '', status: 'draft', visible: 1 };
function fields(content, schema = {}) {
  const label = (path) => schema.labels?.[path] ?? (schema.labels ? COMMON_LABELS[path] : undefined) ?? path;
  return Object.entries(content).filter(([k]) => k !== '_id').flatMap(([key, value]) => {
    // Eze collections only accept arrays of objects. Primitive arrays are exposed
    // as individually editable scalar paths while their runtime shape stays intact.
    if (Array.isArray(value) && value.length && value.every(item => item === null || typeof item !== 'object')) {
      return value.map((item, index) => ({ key: `${key}-${index}`, path: `${key}.${index}`, label: schema.labels ? label(`${key}.${index}`) : `${key} ${index + 1}`, type: typeof item === 'number' ? 'number' : 'string', ...(typeof item === 'string' ? { multiline: true } : {}) }));
    }
    const type = Array.isArray(value) ? 'collection' : typeof value === 'number' ? 'number' : value && typeof value === 'object' ? 'link' : ['image', 'cover', 'portrait'].includes(key) ? 'image' : 'string';
    return {
      key: schema.keys?.[key] ?? key, path: key, label: label(key), type,
      ...(schema.required?.includes(key) ? { required: true } : {}),
      ...(type === 'string' ? { multiline: true } : {}),
      ...(type === 'collection' ? { minItems: 0, maxItems: 200, itemFields: itemFields(value, schema) } : {}),
    };
  });
}
// Union of the keys of every item, so optional item fields (e.g. `subtitle`) are declared even if the first item lacks them.
function itemFields(items, schema) {
  const sample = items.length ? Object.assign({}, ...items) : article;
  return fields(sample, schema).map(({ required, ...field }) => field);
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
let manifest;
try {
  const { content } = await server.ssrLoadModule('/src/components/institutional/content.js');
  const { LANDING_ROUTE, landingSections, landingInitialContent } = await server.ssrLoadModule('/src/data/claudia/landingCms.js');

  const pages = Object.entries(content).map(([route, sections]) => {
    const meta = PAGES[route];
    if (!meta) throw new Error(`Ruta sin identidad CMS declarada en PAGES: ${route}`);
    return {
      key: meta.key, name: meta.name, route, slug: meta.key,
      sections: Object.entries(sections).filter(([key]) => !GLOBAL_SECTIONS[route]?.includes(key))
        .map(([key, initialContent]) => ({ key, name: key, type: key, initialContent, fields: fields(initialContent) })),
    };
  });
  pages.splice(pages.findIndex(page => page.route === '/articulos'), 0, {
    key: 'diseno-de-carrera', name: 'Diseño de Carrera', route: LANDING_ROUTE, slug: 'diseno-de-carrera',
    sections: landingSections.map((section, position) => {
      const schema = LANDING_SCHEMA[section.key];
      if (!schema) throw new Error(`Sección de la landing sin esquema: ${section.key}`);
      const initialContent = landingInitialContent(section);
      return { key: section.key, name: schema.name, type: schema.type, position, visible: true, lockedPosition: false, initialContent, fields: fields(initialContent, schema) };
    }),
  });

  manifest = {
    version: 1,
    site: { key: 'claudia-sanchez', name: 'Claudia Sánchez Urencio' },
    globals: [
      { key: 'institutional-navbar', name: 'Navegación institucional', published: true, initialContent: content['/'].navbar, fields: fields(content['/'].navbar) },
      { key: 'institutional-footer', name: 'Pie institucional', published: true, initialContent: content['/'].footer, fields: [
        { key: 'brand', path: 'brand', label: 'Marca', type: 'string', required: true },
        { key: 'line', path: 'line', label: 'Descripción', type: 'string', required: true },
        { key: 'linkedin', path: 'linkedin', label: 'LinkedIn', type: 'link', required: true },
      ] },
    ],
    pages,
  };
} finally {
  await server.close();
}

for (const page of manifest.pages) {
  const sectionKeys = new Set();
  for (const section of page.sections) {
    if (sectionKeys.has(section.key)) throw new Error(`Sección duplicada: ${page.route}/${section.key}`); sectionKeys.add(section.key);
    for (const field of section.fields) {
      if (field.type !== 'collection') continue;
      const items = field.path.split('.').reduce((value, part) => value?.[part], section.initialContent);
      if (!Array.isArray(items)) throw new Error(`Colección sin array: ${page.route}/${section.key}/${field.path}`);
      const ids = new Set();
      for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Colección con elemento no objeto: ${page.route}/${section.key}/${field.path}`);
        if (typeof item._id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(item._id) || ids.has(item._id)) throw new Error(`_id inválido o duplicado: ${page.route}/${section.key}/${field.path}`);
        ids.add(item._id);
      }
    }
  }
}
const manifestText = JSON.stringify(manifest, null, 2) + '\n';
for (const pattern of OBSOLETE_PATTERNS) if (pattern.test(manifestText)) throw new Error(`El manifiesto contiene contenido obsoleto: ${pattern}`);

const rows = ['# Matriz de cobertura Eze CMS', '', `Generada por \`npm run cms:manifest\` desde los fallbacks efectivos de React (${MANIFEST_PATH}). No editar a mano.`, '', '| Página | Sección | Campo | Tipo |', '|---|---|---|---|'];
for (const group of manifest.globals) for (const f of group.fields) rows.push(`| GLOBAL | ${group.key} | ${f.path} | ${f.type} |`);
for (const page of manifest.pages) for (const s of page.sections) for (const f of s.fields) {
  rows.push(`| ${page.route} | ${s.key} | ${f.path} | ${f.type} |`);
  for (const sub of f.itemFields || []) rows.push(`| ${page.route} | ${s.key} | ${f.path}[] → ${sub.path} | ${sub.type} |`);
}
rows.push('', 'Las colecciones se seleccionan completas o por `_id`, sin paths indexados en el panel de colección.', '', 'Los artículos se leen del módulo de artículos (`get_published_articles`); `/articulos › listado.items` no se usa.', '', 'Gracias: `confirmacion`, `proximos-pasos` y `volver` quedan preparados; no se muestran hasta implementar una confirmación verificable.');
const coverageText = rows.join('\n') + '\n';

if (check) {
  const stale = [[MANIFEST_PATH, manifestText], [COVERAGE_PATH, coverageText]].filter(([path, text]) => !fs.existsSync(path) || fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n') !== text).map(([path]) => path);
  if (stale.length) { console.error(`Desactualizado respecto de los fallbacks de React: ${stale.join(', ')}. Ejecutá npm run cms:manifest.`); process.exit(1); }
  console.log('OK: manifiesto y matriz coinciden con los fallbacks de React.');
} else {
  fs.writeFileSync(MANIFEST_PATH, manifestText);
  fs.writeFileSync(COVERAGE_PATH, coverageText);
  console.log(`Manifiesto y matriz generados localmente (${manifest.pages.length} páginas). Sin sincronizar.`);
}
