import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, MQ } from '../../utils/gsap.js';
import SectionHead from './SectionHead.jsx';
import type from './type.module.css';
import styles from './Approach.module.css';

const NODE_THRESHOLDS = [1 / 6, 1 / 2, 5 / 6];

/**
 * 03 · Enfoque. M03 Drawn Journey: un trazo SVG que se dibuja con el scroll (scrub, sin pin) y activa tres hitos.
 * Mobile: riel vertical. Sin movimiento (o sin JS) el trazo y los tres hitos se ven completos.
 */
export default function Approach({ content }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, wide: MQ.wide }, (ctx) => {
        const { motion, wide } = ctx.conditions;
        if (!motion) return undefined;
        const el = root.current;
        const q = gsap.utils.selector(el);
        const items = q('[data-step]');
        el.setAttribute('data-armed', '');

        gsap.from(q('[data-rv="intro"]'), {
          opacity: 0,
          y: 18,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: q('[data-rv="intro"]')[0], start: 'top 88%', once: true },
        });

        if (wide) {
          const setActive = (progress) =>
            items.forEach((item, index) => item.toggleAttribute('data-active', progress >= NODE_THRESHOLDS[index] - 0.001));
          gsap.fromTo(
            q('[data-rv="path"]'),
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: q('[data-rv="track"]')[0],
                start: 'top 84%',
                end: 'top 42%',
                scrub: 0.6,
                onUpdate: (self) => setActive(self.progress),
                onRefresh: (self) => setActive(self.progress),
              },
            },
          );
        } else {
          gsap.fromTo(
            q('[data-rv="rail"]'),
            { scaleY: 0, transformOrigin: 'top center' },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: { trigger: q('[data-rv="track"]')[0], start: 'top 75%', end: 'bottom 60%', scrub: 0.5 },
            },
          );
          items.forEach((item) => {
            gsap.from(item, {
              opacity: 0,
              y: 18,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: { trigger: item, start: 'top 85%', once: true },
            });
            ScrollTrigger.create({
              trigger: item,
              start: 'top 70%',
              onEnter: () => item.setAttribute('data-active', ''),
              onLeaveBack: () => item.removeAttribute('data-active'),
            });
          });
        }

        return () => {
          el.removeAttribute('data-armed');
          items.forEach((item) => item.removeAttribute('data-active'));
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="enfoque" className={`${type.section} ${styles.section}`} aria-labelledby="enfoque-title" data-tone="dark" ref={root}>
      <div className={type.container}>
        <div className={styles.head}>
          <SectionHead eyebrow={content.eyebrow} title={content.title} id="enfoque-title" className={styles.headMain} />
          <p className={`${type.lead} ${styles.intro}`} data-rv="intro">
            {content.intro}
          </p>
        </div>

        <div className={styles.track} data-rv="track">
          <svg className={styles.path} viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path className={styles.pathBase} d="M0 30 H166.7 C250 -2 416 62 500 30 S 750 62 833.3 30 H1000" />
            <path
              className={styles.pathDraw}
              data-rv="path"
              pathLength="1"
              d="M0 30 H166.7 C250 -2 416 62 500 30 S 750 62 833.3 30 H1000"
            />
          </svg>
          <span className={styles.rail} data-rv="rail" aria-hidden="true" />
          <ol className={styles.steps}>
            {content.steps.map((step) => (
              <li className={styles.step} key={step.number} data-step>
                <span className={styles.node} aria-hidden="true" />
                <span className={styles.number} aria-hidden="true">
                  {step.number}
                </span>
                <h3 className={styles.label}>{step.label}</h3>
                <p className={styles.text}>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
