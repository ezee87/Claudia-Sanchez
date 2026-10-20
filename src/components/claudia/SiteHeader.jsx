import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMediaQuery } from '../../utils/useMediaQuery.js';
import BookingCTA from './BookingCTA.jsx';
import styles from './SiteHeader.module.css';

/** Header: marca + anclas + CTA único. Menú mobile accesible (aria-expanded, Escape, foco). */
export default function SiteHeader({ brand, nav }) {
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
    const targets = nav.map(({ id }) => document.getElementById(id)).filter(Boolean);
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
  }, [nav]);

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
        <a className={styles.brand} href="#inicio" onClick={close} aria-label={`${brand}, ir al inicio`}>
          {brand}
        </a>

        <nav className={styles.nav} aria-label="Principal">
          <ul>
            {nav.map(({ id, label }) => (
              <li key={id}>
                <a href={`#${id}`} aria-current={active === id ? 'true' : undefined}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.cta}>
          <BookingCTA variant="outline" label="Reservar" className={styles.compactCta} />
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
                {nav.map(({ id, label }) => (
                  <li key={id}>
                    <a href={`#${id}`} onClick={close} aria-current={active === id ? 'true' : undefined}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <BookingCTA variant="gold" label="Reservar" onClick={close} />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
