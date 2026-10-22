import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import { BOOKING_LABEL, BOOKING_URL } from '../../data/claudia/booking.js';
import { ClaudiaEditable, ClaudiaEditableCollection, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import { resolveCmsLink } from '../../integration/eze-cms/cmsLink.js';
import SectionHead from './SectionHead.jsx';
import BookingCTA from './BookingCTA.jsx';
import type from './type.module.css';
import styles from './Testimonials.module.css';

const EASE = [0.22, 1, 0.36, 1];
const pad = (n) => String(n).padStart(2, '0');

/**
 * Voces de experiencia. Selector manual (sin autoplay).
 * GSAP: revelado inicial por scroll. Motion: cambio de testimonio (opacity/y de cada panel).
 * El panel activo ocupa solo la altura de su propio contenido.
 */
export default function Testimonials({ content: fallback }) {
  const root = useRef(null);
  const { content } = useClaudiaCmsSection('testimonials', { ...fallback, ctaLabel: BOOKING_LABEL, ctaLink: null });
  const ctaLink = resolveCmsLink(content.ctaLink, { label: content.ctaLabel, href: BOOKING_URL });
  const tablist = useRef(null);
  const tabs = useRef([]);
  const [activeId, setActiveId] = useState(null);
  const reduce = useReducedMotion();
  const fallbackIds = useMemo(() => new Map(fallback.items.map((item) => [item.name, item._id])), [fallback.items]);
  const items = useMemo(
    () => (Array.isArray(content.items) ? content.items : []).map((item) => ({
      ...item,
      // Compatibilidad temporal con la coleccion publicada antes de incorporar _id.
      _id: item._id || fallbackIds.get(item.name),
    })).filter((item) => item._id),
    [content.items, fallbackIds],
  );
  const total = items.length;
  const active = Math.max(0, items.findIndex((item) => item._id === activeId));
  const activeItem = items[active];

  useEffect(() => {
    if (!total) {
      if (activeId !== null) setActiveId(null);
      return;
    }
    if (!items.some((item) => item._id === activeId)) setActiveId(items[0]._id);
  }, [activeId, items, total]);
  const [disclaimerLead, disclaimerDetail] = content.disclaimer.split(' · ');

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion }, (ctx) => {
        if (!ctx.conditions.motion) return;
        const q = gsap.utils.selector(root.current);
        const reveal = (target, trigger, vars = {}) =>
          gsap.from(target, {
            opacity: 0,
            y: 22,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger, start: 'top 88%', once: true },
            ...vars,
          });
        reveal(q('[data-rv="stat"]'), q('[data-rv="stat"]')[0]);
        reveal(q('[data-rv="stage"]'), q('[data-rv="stage"]')[0]);
        reveal(q('[data-rv="tab"]'), q('[data-rv="tablist"]')[0], { stagger: 0.07, delay: 0.1 });
        reveal(q('[data-rv="note"]'), q('[data-rv="note"]')[0], { y: 10 });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const select = (index, focus = false) => {
    if (!total) return;
    const next = (index + total) % total;
    setActiveId(items[next]._id);
    const list = tablist.current;
    const tab = tabs.current[next];
    if (list && tab) {
      const left = tab.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
      const right = left + tab.offsetWidth;
      const target = left < list.scrollLeft ? left : right > list.scrollLeft + list.clientWidth ? right - list.clientWidth : list.scrollLeft;
      if (target !== list.scrollLeft) list.scrollTo({ left: target, behavior: 'instant' });
    }
    if (focus) tab?.focus({ preventScroll: true });
  };

  const onKeyDown = (event) => {
    const keys = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: total - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key], true);
  };

  const transition = { duration: reduce ? 0 : 0.32, ease: EASE };
  const activePhoto = activeItem && (
    <img
      className={styles.photo}
      src={activeItem.image}
      alt={`Retrato ilustrativo de ${activeItem.name}`}
      width="1254"
      height="1254"
      loading={active === 0 ? 'eager' : 'lazy'}
      decoding="async"
    />
  );

  return (
    <section id="testimonios" className={`${type.section} ${styles.section}`} aria-labelledby="testimonios-title" data-tone="white">
      <div className={type.container} ref={root}>
        <div className={styles.head}>
          <SectionHead eyebrow={content.eyebrow} title={content.title} id="testimonios-title" className={styles.headMain} cmsSection="testimonials" />
        </div>

        <div className={styles.body}>
          <div className={styles.strip}>
          <p className={styles.stat} data-rv="stat">
            <ClaudiaEditable sectionKey="testimonials" fieldPath="stat.value"><span className={styles.statValue}>{content.stat.value}</span></ClaudiaEditable>
            <ClaudiaEditable sectionKey="testimonials" fieldPath="stat.label"><span className={styles.statLabel}>{content.stat.label}</span></ClaudiaEditable>
          </p>
          <ClaudiaEditableCollection sectionKey="testimonials" collectionPath="items"><div
              ref={tablist}
              className={styles.tablist}
              role="tablist"
              aria-label="Elegir testimonio"
              aria-orientation="horizontal"
              data-rv="tablist"
              onKeyDown={onKeyDown}
            >
            {items.map((item, i) => (
              <ClaudiaEditableCollection key={item._id} sectionKey="testimonials" collectionPath="items" itemId={item._id}><button
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`testimonio-tab-${i}`}
                  aria-selected={i === active}
                  aria-controls={`testimonio-panel-${i}`}
                  tabIndex={i === active ? 0 : -1}
                  className={styles.tab}
                  data-rv="tab"
                  onClick={() => select(i)}
                >
                  <img className={styles.thumb} src={item.image} alt="" width="1254" height="1254" loading="lazy" decoding="async" />
                  <span className={styles.tabText}>
                    <span className={styles.tabName}>{item.name}</span>
                    <span className={styles.tabRole}>{item.role}</span>
                  </span>
                </button></ClaudiaEditableCollection>
            ))}
            </div></ClaudiaEditableCollection>
          </div>

          {activeItem && <div className={styles.stage} data-rv="stage">
            <div className={styles.stageTop}>
              <p className={styles.counter} aria-live="polite" aria-atomic="true">
                <span className={styles.counterNow}>{pad(active + 1)}</span> / {pad(total)}
              </p>
              <div className={styles.arrows}>
                <button type="button" className={styles.arrow} onClick={() => select(active - 1)} aria-label="Testimonio anterior">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button type="button" className={styles.arrow} onClick={() => select(active + 1)} aria-label="Testimonio siguiente">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            <div className={styles.panels}>
              <ClaudiaEditableCollection key={activeItem._id} sectionKey="testimonials" collectionPath="items" itemId={activeItem._id}><motion.figure
                  className={styles.panel}
                  id={`testimonio-panel-${active}`}
                  role="tabpanel"
                  aria-labelledby={`testimonio-tab-${active}`}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={transition}
                >
                  <figcaption className={styles.caption}>
                    <span className={styles.name}>{activeItem.name}</span>
                    <span className={styles.role}>{activeItem.role}</span>
                  </figcaption>
                  {activePhoto}
                  <blockquote className={styles.quote}><p>{activeItem.quote}</p></blockquote>
                  <div className={styles.action}><ClaudiaEditable sectionKey="testimonials" fieldPath="ctaLink"><BookingCTA label={ctaLink.label} href={ctaLink.href} /></ClaudiaEditable></div>
                </motion.figure></ClaudiaEditableCollection>
              {items.map((item, i) => i === active ? null : (
                <div key={item._id} id={`testimonio-panel-${i}`} role="tabpanel" aria-labelledby={`testimonio-tab-${i}`} hidden />
              ))}
            </div>
          </div>}

        </div>

        <div className={styles.after} data-rv="note">
          <ClaudiaEditable sectionKey="testimonials" fieldPath="disclaimer"><p className={styles.note}>{disclaimerLead}.<br />{disclaimerDetail}</p></ClaudiaEditable>
        </div>
      </div>
    </section>
  );
}
