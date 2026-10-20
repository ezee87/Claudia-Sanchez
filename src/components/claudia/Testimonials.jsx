import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
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
export default function Testimonials({ content }) {
  const root = useRef(null);
  const tablist = useRef(null);
  const tabs = useRef([]);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const total = content.items.length;
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
    const next = (index + total) % total;
    setActive(next);
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

  return (
    <section id="testimonios" className={`${type.section} ${styles.section}`} aria-labelledby="testimonios-title" data-tone="white">
      <div className={type.container} ref={root}>
        <div className={styles.head}>
          <SectionHead eyebrow={content.eyebrow} title={content.title} id="testimonios-title" className={styles.headMain} />
        </div>

        <div className={styles.body}>
          <div className={styles.strip}>
          <p className={styles.stat} data-rv="stat">
            <span className={styles.statValue}>{content.stat.value}</span>
            <span className={styles.statLabel}>{content.stat.label}</span>
          </p>
          <div
            ref={tablist}
            className={styles.tablist}
            role="tablist"
            aria-label="Elegir testimonio"
            aria-orientation="horizontal"
            data-rv="tablist"
            onKeyDown={onKeyDown}
          >
            {content.items.map((item, i) => (
              <button
                key={item.name}
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
              </button>
            ))}
          </div>
          </div>

          <div className={styles.stage} data-rv="stage">
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
              <motion.figure
                key={content.items[active].name}
                className={styles.panel}
                id={`testimonio-panel-${active}`}
                role="tabpanel"
                aria-labelledby={`testimonio-tab-${active}`}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
              >
                <figcaption className={styles.caption}>
                  <span className={styles.name}>{content.items[active].name}</span>
                  <span className={styles.role}>{content.items[active].role}</span>
                </figcaption>
                <img
                  className={styles.photo}
                  src={content.items[active].image}
                  alt={`Retrato ilustrativo de ${content.items[active].name}`}
                  width="1254"
                  height="1254"
                  loading={active === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <blockquote className={styles.quote}><p>{content.items[active].quote}</p></blockquote>
                <div className={styles.action}><BookingCTA /></div>
              </motion.figure>
              {content.items.map((item, i) => i === active ? null : (
                <div key={item.name} id={`testimonio-panel-${i}`} role="tabpanel" aria-labelledby={`testimonio-tab-${i}`} hidden />
              ))}
            </div>
          </div>

        </div>

        <div className={styles.after} data-rv="note">
          <p className={styles.note}>
            {disclaimerLead}.<br />{disclaimerDetail}
          </p>
        </div>
      </div>
    </section>
  );
}
