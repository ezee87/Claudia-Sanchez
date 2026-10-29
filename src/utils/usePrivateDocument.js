import { useEffect } from 'react';

function ensureMeta(name) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  return el;
}

// Privacidad por no descubribilidad: toda vista del sistema es noindex/nofollow.
export function usePrivateDocument(title) {
  useEffect(() => {
    const previous = document.title;
    // Sin título (sección seo oculta en el CMS) se conserva el del documento.
    if (title !== undefined) document.title = title;
    // Etiquetas del artículo renderizado en el servidor (api/articulo.js) si se llegó aquí navegando desde él.
    document.head.querySelectorAll('[data-ssr-seo]').forEach((el) => el.remove());
    ensureMeta('robots').setAttribute('content', 'noindex, nofollow, noarchive');
    return () => {
      document.title = previous;
    };
  }, [title]);
}
