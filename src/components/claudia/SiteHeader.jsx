import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMediaQuery } from '../../utils/useMediaQuery.js';
import { ClaudiaEditable, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import { resolveCmsLink } from '../../integration/eze-cms/cmsLink.js';
import { headerCtaLink, navLinkFallback, siteHeaderFallback } from '../../data/claudia/landingCms.js';
import BookingCTA from './BookingCTA.jsx';
import { scrollToTop } from '../ui/BackToTop.jsx';
import styles from './SiteHeader.module.css';

const EASE = [0.22, 1, 0.36, 1];

/** Header: marca + anclas + CTA único. Menú mobile accesible (aria-expanded, Escape, foco). */
export default function SiteHeader({ brand, nav, tagline }) {
  const { content } = useClaudiaCmsSection('site-header', siteHeaderFallback(brand));
  // La frase al pie del menú mobile es el cierre de «Tu siguiente movimiento» (misma fuente que en el CMS).
  const situationsFallback = useMemo(() => ({ closing: tagline }), [tagline]);
  const { content: situations } = useClaudiaCmsSection('situations', situationsFallback);
  const reduceMotion = useReducedMotion();
  const panelMotion = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : -8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: EASE, staggerChildren: reduceMotion ? 0 : 0.045, delayChildren: reduceMotion ? 0 : 0.06 },
    },
  };
  const itemMotion = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
  };
  const brandLink = resolveCmsLink(content.brandLink, { label: brand, href: '#inicio' });
  const ctaLink = resolveCmsLink(content.ctaLink, headerCtaLink);
  const navLinks = useMemo(() => nav.map((item, index) => ({
    id: item.id,
    ...resolveCmsLink(content[`navLink${index}`], navLinkFallback(item)),
  })), [content, nav]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef(null);
  const pendingHash = useRef('');
  const pendingTop = useRef(false);
  const isDesktop = useMediaQuery('(min-width: 960px)');

  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Bloquea el scroll de la página con el menú abierto; al cerrar lo restaura y, si se eligió
  // una sección (o volver arriba), navega recién entonces (con el scroll ya liberado).
  // Solo se bloquea <html>: si también se bloquea <body>, este pasa a ser el contenedor del
  // header sticky y el header (con la X) salta fuera de pantalla cuando la página está scrolleada.
  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
      if (pendingTop.current) {
        pendingTop.current = false;
        scrollToTop();
        return;
      }
      const hash = pendingHash.current;
      pendingHash.current = '';
      const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      target.scrollIntoView({ block: 'start' });
      window.history.pushState(null, '', hash);
    };
  }, [open]);

  useEffect(() => {
    const targets = navLinks.map(({ id }) => document.getElementById(id)).filter(Boolean);
    const visible = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting));
        const current = targets.find((target) => visible.get(target.id));
        setActive(current ? current.id : '');
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [navLinks]);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const close = () => setOpen(false);
  const navigate = (event, href) => {
    if (open && href?.startsWith('#') && href.length > 1) {
      event.preventDefault();
      pendingHash.current = href;
    }
    close();
  };
  const goTop = (event) => {
    event.preventDefault();
    pendingTop.current = true;
    close();
  };

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled ? '' : undefined}
    >
      <div className={styles.bar}>
        <ClaudiaEditable sectionKey="site-header" fieldPath="brandLink"><a className={styles.brand} href={brandLink.href} onClick={(event) => navigate(event, brandLink.href)} aria-label={`${brandLink.label}, ir al inicio`}>{brandLink.label}</a></ClaudiaEditable>

        <nav className={styles.nav} aria-label="Principal">
          <ul>
            {navLinks.map((link, index) => {
              return <li key={link.id}>
                <ClaudiaEditable sectionKey="site-header" fieldPath={`navLink${index}`}>
                  <a href={link.href} aria-current={active === link.id ? 'true' : undefined}>{link.label}</a>
                </ClaudiaEditable>
              </li>
            })}
          </ul>
        </nav>

        <div className={styles.cta}>
          <ClaudiaEditable sectionKey="site-header" fieldPath="ctaLink"><BookingCTA variant="outline" label={ctaLink.label} href={ctaLink.href} className={styles.compactCta} /></ClaudiaEditable>
        </div>

        <button
          ref={toggle}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.bars} data-open={open ? '' : undefined} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && !isDesktop && (
          <motion.div
            id="menu-movil"
            className={styles.panel}
            variants={panelMotion}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            <nav aria-labelledby="menu-movil-titulo">
              <ClaudiaEditable sectionKey="site-header" fieldPath="menuEyebrow"><motion.p id="menu-movil-titulo" className={styles.panelEyebrow} variants={itemMotion}>{content.menuEyebrow}</motion.p></ClaudiaEditable>
              <ul>
                <motion.li variants={itemMotion}>
                  <ClaudiaEditable sectionKey="site-header" fieldPath="menuHomeLabel"><a href="#inicio" onClick={goTop}>{content.menuHomeLabel}</a></ClaudiaEditable>
                </motion.li>
                {navLinks.map((link, index) => {
                  return <motion.li key={link.id} variants={itemMotion}>
                    <ClaudiaEditable sectionKey="site-header" fieldPath={`navLink${index}`}><a href={link.href} onClick={(event) => navigate(event, link.href)} aria-current={active === link.id ? 'true' : undefined}>{link.label}</a></ClaudiaEditable>
                  </motion.li>
                })}
              </ul>
            </nav>
            <motion.div className={styles.panelCtaWrap} variants={itemMotion}>
              <ClaudiaEditable sectionKey="site-header" fieldPath="ctaLink"><BookingCTA variant="gold" label={ctaLink.label} href={ctaLink.href} className={styles.panelCta} onClick={close} /></ClaudiaEditable>
            </motion.div>
            {situations.closing && (
              <motion.p className={styles.panelTagline} variants={itemMotion}>{situations.closing}</motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
