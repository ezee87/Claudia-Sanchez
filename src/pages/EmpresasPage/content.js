// Keep the existing CMS description field: separate its introductory paragraphs
// from the semicolon-delimited methodology, including the optional coaching line.
export function splitServiceDescription(description = '') {
  const paragraphs = description.split('\n\n');
  const methodology = paragraphs.findIndex(p => /^Incluye\s/i.test(p));
  if (methodology < 0) return { audience: paragraphs, included: [] };
  const included = paragraphs.slice(methodology).join('\n\n').replace(/^Incluye\s+/i, '')
    .split(/;\s*|\.\s+(?=Coaching ejecutivo opcional)/)
    .map(text => text.trim().replace(/\.$/, '')).filter(Boolean)
    .map(text => text.charAt(0).toUpperCase() + text.slice(1));
  return { audience: paragraphs.slice(0, methodology), included };
}

// Keep "un/una" with the next word so headings do not break after it.
export const bindArticles = (text = '') => text.replace(/\b(un|una)\s+(?=\S)/gi, '$1\u00a0');

// Old published sections must not replace the newly supplied recommendations.
// Accept subsequent CMS edits, including collection order/visibility, normally.
export function resolveBusinessTestimonials(remote, fallback) {
  if (!remote || /pendientes de verificaci[oó]n/i.test(remote.title || '')
    || /se publicar[aá]n cuando/i.test(remote.paragraph1 || '')) return fallback;
  return remote;
}
