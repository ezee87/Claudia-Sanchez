// HTML inicial con metadatos SEO por página (Etapa 2A SEO). Después de `vite build`, escribe una copia de index.html por
// cada página del manifiesto con su <title>, description, robots, canonical y Open Graph ya resueltos, con los mismos datos
// del build que usa React como estado inicial: get_public_page_seo y la sección seo del snapshot del CMS o, en modo local,
// los fallbacks locales. El contenido lo sigue montando React. Genera index.html (/), <ruta>/index.html y 404.html:
// archivos estáticos que cualquier hosting puede servir; la correspondencia URL → archivo es configuración del hosting.
import fs from 'node:fs';
import path from 'node:path';
import { assertTemplate, renderPageDocument } from '../api/_lib/seoDocument.js';
import { ARTICLE_AUTHOR } from '../src/integration/eze-cms/articleShared.js';
import { globalIndexing, resolveCanonical, resolvePageSeo, resolveRobots, siteOrigin } from '../src/integration/eze-cms/seoShared.js';

const MANIFEST = 'src/integration/eze-cms/claudia-sanchez.manifest.json';
const VIRTUAL_ID = 'virtual:eze-cms-snapshot';
const ARTICLE_ROUTE = '/articulos/:slug';

export const outputFile = (route) => route === '/' ? 'index.html' : route === '/404' ? '404.html' : `${route.slice(1)}/index.html`;

/** Fallbacks locales y la regla de mezcla de React, cargados con Vite (content.js importa JSON). Aquí el snapshot no se usa. */
export async function loadPageSeoSources(root) {
  const { createServer } = await import('vite');
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false },
    plugins: [{
      name: 'snapshot-null',
      resolveId: (id) => (id === VIRTUAL_ID ? `\0${VIRTUAL_ID}` : null),
      load: (id) => (id === `\0${VIRTUAL_ID}` ? 'export default null;' : null),
    }],
  });
  try {
    return await server.ssrLoadModule('/src/integration/eze-cms/pageSeoSources.js');
  } finally {
    await server.close();
  }
}

/** [{ route, file, html }] de cada página del manifiesto, salvo /articulos/:slug (lo resuelve api/articulo.js por artículo). */
export function prerenderPages({ template, manifest, snapshot, sources, env }) {
  assertTemplate(template);
  const origin = siteOrigin(env.VITE_SITE_URL);
  const indexing = globalIndexing({ allow: env.VITE_SEO_ALLOW_INDEXING, siteUrl: env.VITE_SITE_URL, deployEnv: env.VERCEL_ENV });
  return manifest.pages.map((page) => page.route).filter((route) => route !== ARTICLE_ROUTE).map((route) => {
    const id = `${route}::seo`;
    const fallback = sources.pageSeoFallback(route);
    const remote = snapshot?.sections?.[id];
    const seo = resolvePageSeo({
      pageSeo: snapshot?.pageSeo?.[route] ?? null,
      section: fallback ? sources.mergeCmsContent(fallback, remote) : remote,
      hidden: snapshot?.hidden?.includes(id) ?? false,
    });
    return {
      route,
      file: outputFile(route),
      html: renderPageDocument(template, {
        path: route,
        title: seo.title,
        description: seo.description,
        siteName: ARTICLE_AUTHOR,
        robots: resolveRobots({ indexing, noindex: seo.noindex, route }),
        canonical: route === '/404' ? '' : resolveCanonical({ cmsCanonical: seo.canonical, origin, path: route }),
      }),
    };
  });
}

export function seoPrerenderPlugin() {
  let config;
  return {
    name: 'seo-prerender',
    apply: 'build',
    configResolved(resolved) { config = resolved; },
    async writeBundle(options, bundle) {
      const asset = bundle['index.html'];
      if (asset?.type !== 'asset') return;
      const manifest = JSON.parse(fs.readFileSync(path.resolve(config.root, MANIFEST), 'utf8'));
      const snapshot = config.plugins.find((plugin) => plugin.name === 'eze-cms-snapshot')?.api?.getSnapshot() ?? null;
      const pages = prerenderPages({
        template: String(asset.source),
        manifest,
        snapshot,
        sources: await loadPageSeoSources(config.root),
        env: { ...config.env, VERCEL_ENV: process.env.VERCEL_ENV },
      });
      for (const page of pages) {
        const file = path.join(options.dir, page.file);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, page.html);
      }
      config.logger.info(`[seo] HTML inicial con metadatos ${snapshot ? 'del CMS' : 'locales'}: ${pages.map((page) => page.file).join(', ')}.`);
    },
  };
}
