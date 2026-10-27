import content from '../../data/institutional/content.json';
import { careerContent } from '../../data/institutional/careerContent';
import { PERSONAS_WHATSAPP_HREFS } from '../../data/institutional/whatsapp';
// Preserve the Personas editorial content requested in the redesign.
for (const [route, sections] of Object.entries(careerContent)) {
  if (route !== '/personas') content[route] = { ...(content[route] || {}), ...sections };
}
for (const item of content['/personas']?.servicios?.items || []) {
  if (PERSONAS_WHATSAPP_HREFS[item._id]) item.href = PERSONAS_WHATSAPP_HREFS[item._id];
}
export { content };

export function safeHref(value, fallback = '/contacto') {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u0020\\]/.test(value)) return fallback;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (/^#[\w-]+$/.test(value)) return value;
  try { if (['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(value).protocol)) return value; } catch { /* use safe local destination */ }
  return fallback;
}
export function safeImage(value, fallback = '') {
  const url = safeHref(value, fallback);
  return /^(https?:\/\/|\/(?!\/))/.test(url) ? url : fallback;
}
export function validItems(value) {
  const seen = new Set();
  return (Array.isArray(value) ? value : []).filter(item => {
    if (!item || typeof item !== 'object' || typeof item._id !== 'string' || seen.has(item._id)) return false;
    seen.add(item._id);
    return item.visible !== 0;
  }).map(item => Object.fromEntries(Object.entries(item).filter(([key,v]) => key==='visible' ? typeof v==='number' : typeof v==='string')));
}
export function publishedArticles(items) {
  const slugs = new Set();
  return validItems(items).filter(a => {
    if (a.status !== 'published' || !a.title || !a.body?.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug) || !/^\d{4}-\d{2}-\d{2}$/.test(a.publishedAt) || !Number.isFinite(Date.parse(a.publishedAt)) || slugs.has(a.slug)) return false;
    slugs.add(a.slug); return true;
  }).sort((a,b) => b.publishedAt.localeCompare(a.publishedAt));
}
export const articleFields = { slug:'', title:'', publishedAt:'', cover:'', alt:'', body:'', status:'draft', visible:1 };
export const formatDate = value => new Intl.DateTimeFormat('es', {dateStyle:'long',timeZone:'UTC'}).format(new Date(value));
