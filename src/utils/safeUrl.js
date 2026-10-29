// Sin dependencias de navegador: también lo usa la función de Vercel que renderiza artículos (api/articulo.js).
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
