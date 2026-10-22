import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMediaQuery } from '../../utils/useMediaQuery.js';
import { ClaudiaEditable, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import { resolveCmsLink } from '../../integration/eze-cms/cmsLink.js';
import { BOOKING_URL } from '../../data/claudia/booking.js';
import BookingCTA from './BookingCTA.jsx';
import styles from './SiteHeader.module.css';

/** Header: marca + anclas + CTA único. Menú mobile accesible (aria-expanded, Escape, foco). */
export default function SiteHeader({ brand, nav }) {
  const { content } = useClaudiaCmsSection('site-header', { brandLink: { label: brand, href: '#inicio' }, ctaLink: null });
  const brandLink = resolveCmsLink(content.brandLink, { label: brand, href: '#inicio' });
  const ctaLink = resolveCmsLink(content.ctaLink, { label: 'Reservar', href: BOOKING_URL });
  const navLinks = useMemo(() => nav.map((item, index) => ({
    id: item.id,
    ...resolveCmsLink(content[`navLink${index}`], { label: item.label, href: `#${item.id}` }),
  })), [content, nav]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef(null);
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

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled ? '' : undefined}
    >
      <div className={styles.bar}>
        <ClaudiaEditable sectionKey="site-header" fieldPath="brandLink"><a className={styles.brand} href={brandLink.href} onClick={close} aria-label={`${brandLink.label}, ir al inicio`}>{brandLink.label}</a></ClaudiaEditable>

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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav aria-label="Menú móvil">
              <ul>
                {navLinks.map((link, index) => {
                  return <li key={link.id}>
                    <ClaudiaEditable sectionKey="site-header" fieldPath={`navLink${index}`}><a href={link.href} onClick={close} aria-current={active === link.id ? 'true' : undefined}>{link.label}</a></ClaudiaEditable>
                  </li>
                })}
              </ul>
            </nav>
            <ClaudiaEditable sectionKey="site-header" fieldPath="ctaLink"><BookingCTA variant="gold" label={ctaLink.label} href={ctaLink.href} onClick={close} /></ClaudiaEditable>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
