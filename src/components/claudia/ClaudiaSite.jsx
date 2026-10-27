import { useEffect } from 'react';
import { ScrollTrigger } from '../../utils/gsap.js';
import { usePrivateDocument } from '../../utils/usePrivateDocument.js';
import { site } from '../../data/claudia/site.js';
import { careerTestimonials } from '../../data/claudia/careerTestimonials.js';
import { seoFallback } from '../../data/claudia/landingCms.js';
import { useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
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
  const { content: seo } = useClaudiaCmsSection('seo', seoFallback(site.meta));
  usePrivateDocument(seo.title);

  useEffect(() => setMeta('description', seo.description), [seo.description]);

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
      <a className="skip-link" href="#contenido" data-print="hide">
        Saltar al contenido
      </a>

      <SiteHeader brand={site.brand} nav={site.nav} tagline={site.situations.closing} />

      <main id="contenido">
        <Hero hero={site.hero} portrait={site.portrait} />
        <Situations content={site.situations} />
        <CareerTestimonials content={careerTestimonials} />
        <Approach content={site.approach} life={site.life} />
        <About content={site.about} closing={site.closing} portrait={site.portrait} />
      </main>

      <SiteFooter brand={site.brand} content={site.footer} nav={site.nav} />
    </div>
  );
}
