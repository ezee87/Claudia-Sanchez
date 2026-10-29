// Fallback local de la sección `seo` de cada página con HTML propio en el build (scripts/seo-prerender-plugin.mjs):
// el mismo que usan las páginas en React (content.js y, para la landing, landingCms.js).
import { content } from '../../components/institutional/content.js';
import { site } from '../../data/claudia/site.js';
import { LANDING_ROUTE, seoFallback } from '../../data/claudia/landingCms.js';

export { mergeCmsContent } from './useCmsSection';

export function pageSeoFallback(route) {
  if (route === LANDING_ROUTE) return seoFallback(site.meta);
  return content[route]?.seo ?? null;
}
