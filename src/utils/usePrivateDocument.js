import { useEffect } from 'react';
import { NOINDEX } from '../integration/eze-cms/seoShared.js';

function ensureMeta(name) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  return el;
}

// Privacidad por no descubribilidad: noindex/nofollow salvo que el bloqueo global se levante en el dominio definitivo
// (robots lo resuelve resolveRobots en seoShared.js).
export function usePrivateDocument(title, robots = NOINDEX) {
  useEffect(() => {
    const previous = document.title;
    // El HTML inicial del build ya trae las etiquetas de esta URL (data-ssr-seo): se conservan; robots solo se endurece.
    const ssr = [...document.head.querySelectorAll('[data-ssr-seo]')];
    const own = ssr.length > 0 && ssr.every((el) => el.getAttribute('data-ssr-seo') === location.pathname);
    // Etiquetas de otra URL (p. ej. si se llegó aquí navegando desde un artículo): se retiran.
    if (!own) ssr.forEach((el) => el.remove());
    // Sin título (sección seo oculta en el CMS) se conserva el del documento.
    if (title !== undefined) document.title = title;
    if (!own || robots === NOINDEX) ensureMeta('robots').setAttribute('content', robots);
    return () => {
      document.title = previous;
    };
  }, [title, robots]);
}
