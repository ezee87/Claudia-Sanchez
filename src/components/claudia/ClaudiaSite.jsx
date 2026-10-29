import { useEffect } from 'react';
import { ScrollTrigger } from '../../utils/gsap.js';
import { usePrivateDocument } from '../../utils/usePrivateDocument.js';
import { site } from '../../data/claudia/site.js';
import { careerTestimonials } from '../../data/claudia/careerTestimonials.js';
import { seoFallback, siteHeaderFallback } from '../../data/claudia/landingCms.js';
import { CLAUDIA_PAGE_ROUTE, ClaudiaEditable, ClaudiaSection, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import { resolvePageSeo, resolveRobots } from '../../integration/eze-cms/seoShared.js';
import { seoIndexing, usePageSeo } from '../../integration/eze-cms/pageSeo.js';
import SiteHeader from './SiteHeader.jsx';
import Hero from './Hero.jsx';
import Situations from './Situations.jsx';
import CareerTestimonials from './CareerTestimonials.jsx';
import Approach from './Approach.jsx';
import About from './About.jsx';
import SiteFooter from './SiteFooter.jsx';
import './claudia.css';
import './landing.css';

function setMeta(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  const created = !el;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  const previous = el.getAttribute('content');
  el.setAttribute('content', content);
  return () => {
    if (created) el.remove();
    else if (previous !== null) el.setAttribute('content', previous);
  };
}

/**
 * Landing independiente de Claudia Sánchez Urencio: /diseno-de-carrera.
 * Cinco secciones: hero, tu siguiente movimiento, testimonios, mi enfoque (+ L.I.F.E.) y sobre mí (+ reserva).
 */
export default function ClaudiaSite() {
  const { content: seo, hidden: seoHidden } = useClaudiaCmsSection('seo', seoFallback(site.meta));
  const { content: header } = useClaudiaCmsSection('site-header', siteHeaderFallback(site.brand));
  // SEO de la página en Eze CMS y, si falta, la sección seo (que, oculta, no aplica título ni descripción, tampoco locales).
  const pageSeo = resolvePageSeo({ pageSeo: usePageSeo(CLAUDIA_PAGE_ROUTE), section: seo, hidden: seoHidden });
  usePrivateDocument(pageSeo.title, resolveRobots({ indexing: seoIndexing(), noindex: pageSeo.noindex, route: CLAUDIA_PAGE_ROUTE }));

  useEffect(() => (pageSeo.description === undefined ? undefined : setMeta('description', pageSeo.description)), [pageSeo.description]);

  useEffect(() => {
    const restore = [
      setMeta('theme-color', '#1b1a44'),
    ];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    if (!reduce) root.style.scrollBehavior = 'smooth';
    const previousBackground = root.style.background;
    root.style.background = '#1b1a44';
    return () => {
      restore.forEach((undo) => undo());
      root.style.scrollBehavior = previousBehavior;
      root.style.background = previousBackground;
    };
  }, []);

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => window.removeEventListener('load', refresh);
  }, []);

  return (
    <div className="claudia-root claudia-landing">
      <ClaudiaEditable sectionKey="site-header" fieldPath="skipLabel"><a className="skip-link" href="#contenido" data-print="hide">
        {header.skipLabel}
      </a></ClaudiaEditable>

      <ClaudiaSection sectionKey="site-header"><SiteHeader brand={site.brand} nav={site.nav} tagline={site.situations.closing} /></ClaudiaSection>

      <main id="contenido">
        <ClaudiaSection sectionKey="hero"><Hero hero={site.hero} portrait={site.portrait} /></ClaudiaSection>
        <ClaudiaSection sectionKey="situations"><Situations content={site.situations} /></ClaudiaSection>
        <ClaudiaSection sectionKey="career-testimonials"><CareerTestimonials content={careerTestimonials} /></ClaudiaSection>
        <ClaudiaSection sectionKey="approach"><Approach content={site.approach} life={site.life} /></ClaudiaSection>
        <ClaudiaSection sectionKey="about"><About content={site.about} closing={site.closing} portrait={site.portrait} /></ClaudiaSection>
      </main>

      <ClaudiaSection sectionKey="site-footer"><SiteFooter brand={site.brand} content={site.footer} nav={site.nav} /></ClaudiaSection>
    </div>
  );
}
