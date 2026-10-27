// Contenido CMS de la landing /diseno-de-carrera: única fuente para los componentes (fallbacks de los hooks)
// y para el generador del manifiesto (initialContent). Cambiar un valor aquí cambia ambos a la vez.
import { site } from './site.js';
import { BOOKING_LABEL, BOOKING_URL, LINKEDIN_URL } from './booking.js';
import { careerTestimonials, LINKEDIN_RECOMMENDATIONS_URL, LINKEDIN_SOURCE_LABEL } from './careerTestimonials.js';

export const LANDING_ROUTE = '/diseno-de-carrera';

export const bookingLink = { label: BOOKING_LABEL, href: BOOKING_URL };
export const headerCtaLink = { label: 'Reservar', href: BOOKING_URL };
export const footerLinks = {
  homeLink: { label: 'Inicio', href: '/' },
  linkedinLink: { label: 'LinkedIn', href: LINKEDIN_URL },
  calendlyLink: { label: 'Calendly', href: BOOKING_URL },
};
export const navLinkFallback = (item) => ({ label: item.label, href: `#${item.id}` });

// Los campos link se inicializan en null: el componente resuelve el destino con resolveCmsLink y el valor por defecto.
export const heroFallback = (hero, portrait) => ({
  eyebrow: hero.eyebrow,
  title: hero.title,
  highlightedTitle: hero.highlightedTitle,
  description: hero.subtitle,
  ctaLabel: BOOKING_LABEL,
  ctaLink: null,
  complement: hero.complement,
  portrait: portrait.src,
});
export const situationsFallback = (content) => ({ ...content, ctaLabel: BOOKING_LABEL, ctaLink: null });
export const lifeFallback = (content) => ({ ...content, instruction: 'Selecciona una dimensión para explorarla', hubLabel: 'L.I.F.E.' });
export const closingFallback = (closing) => ({ ...closing, ctaLabel: BOOKING_LABEL, ctaLink: null });
export const siteHeaderFallback = (brand) => ({ brandLink: { label: brand, href: '#inicio' }, ctaLink: null });
export const siteFooterFallback = (brand, content) => ({
  brand,
  line: content.line.replace(`${brand} · `, ''),
  description: content.description,
  copyright: content.copyright,
  exploreHeading: 'Explorar',
  connectHeading: 'Conectar',
  homeLink: null,
  linkedinLink: null,
  calendlyLink: null,
});
export const careerTestimonialsFallback = (content) => ({
  eyebrow: content.eyebrow,
  title: content.title,
  subtitle: content.subtitle,
  closing: content.closing,
  ctaLink: null,
  items: content.items.map((item) => ({ ...item, sourceLabel: LINKEDIN_SOURCE_LABEL, linkedinUrl: LINKEDIN_RECOMMENDATIONS_URL })),
});
export const seoFallback = (meta) => ({ title: meta.title, description: meta.description });

const navLinks = (nav) => Object.fromEntries(nav.map((item, index) => [`navLink${index}`, navLinkFallback(item)]));

/**
 * Secciones en orden de render, con el fallback que recibe cada hook y los links efectivos que muestra el
 * componente cuando el campo link falta. `obsolete` lista claves del fallback que no se declaran en el CMS.
 */
export const landingSections = [
  { key: 'hero', fallback: heroFallback(site.hero, site.portrait), links: { ctaLink: bookingLink }, obsolete: ['ctaLabel'] },
  { key: 'situations', fallback: situationsFallback(site.situations), links: { ctaLink: bookingLink }, obsolete: ['ctaLabel'] },
  { key: 'career-testimonials', fallback: careerTestimonialsFallback(careerTestimonials), links: { ctaLink: bookingLink } },
  { key: 'approach', fallback: site.approach },
  { key: 'life', fallback: lifeFallback(site.life) },
  { key: 'about', fallback: site.about },
  { key: 'closing', fallback: closingFallback(site.closing), links: { ctaLink: bookingLink }, obsolete: ['ctaLabel'] },
  { key: 'site-header', fallback: siteHeaderFallback(site.brand), links: { ...navLinks(site.nav), ctaLink: headerCtaLink } },
  { key: 'site-footer', fallback: siteFooterFallback(site.brand, site.footer), links: { ...navLinks(site.nav), ...footerLinks } },
  { key: 'seo', fallback: seoFallback(site.meta) },
];

/** Contenido que debe quedar en el CMS para cada sección: el fallback sin claves obsoletas y con los links resueltos. */
export function landingInitialContent(section) {
  const content = Object.fromEntries(Object.entries(section.fallback).filter(([key]) => !(section.obsolete || []).includes(key)));
  for (const [path, link] of Object.entries(section.links || {})) if (!content[path]) content[path] = { ...link };
  return content;
}
