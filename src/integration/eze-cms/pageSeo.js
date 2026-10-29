import { useEffect, useState } from 'react';
import { cmsRuntimeConfig, readCmsPageSeo } from './cmsRuntime';
import { snapshotPageSeo } from './cmsSnapshot';
import { globalIndexing, siteOrigin } from './seoShared.js';

/** Dominio definitivo para canonicals (VITE_SITE_URL válido), o null. */
export const seoOrigin = siteOrigin(import.meta.env.VITE_SITE_URL);

/** Bloqueo global en el navegador: además de la autorización y el dominio, el host real debe ser el definitivo. */
export const seoIndexing = () => globalIndexing({
  allow: import.meta.env.VITE_SEO_ALLOW_INDEXING,
  siteUrl: import.meta.env.VITE_SITE_URL,
  host: typeof location === 'undefined' ? '' : location.host,
});

/** get_public_page_seo de una ruta: la del build como estado inicial y la publicada como revalidación. Sin ruta, null. */
export function usePageSeo(route) {
  const siteSlug = cmsRuntimeConfig.siteSlug;
  const [pageSeo, setPageSeo] = useState(() => route ? snapshotPageSeo(siteSlug, route) : null);
  useEffect(() => {
    if (!route) { setPageSeo(null); return undefined; }
    let active = true;
    setPageSeo(snapshotPageSeo(siteSlug, route));
    readCmsPageSeo({ siteSlug, pageRoute: route }).then(({ pageSeo: published, error }) => {
      // Un error de lectura conserva lo que ya había (build o fallback local); nunca borra metadatos.
      if (active && !error && published) setPageSeo(published);
    });
    return () => { active = false; };
  }, [route, siteSlug]);
  return pageSeo;
}
