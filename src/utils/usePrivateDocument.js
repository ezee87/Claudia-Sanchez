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
    document.title = title;
    ensureMeta('robots').setAttribute('content', 'noindex, nofollow, noarchive');
    return () => {
      document.title = previous;
    };
  }, [title]);
}
