import { useRef } from 'react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import SectionHead from './SectionHead.jsx';
import BookingCTA from './BookingCTA.jsx';
import type from './type.module.css';
import styles from './Situations.module.css';

/** 02 · Identificación. M01 progresivo + línea conectora M03 (sin pin; en mobile, lista vertical natural). */
export default function Situations({ content }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, wide: MQ.wide }, (ctx) => {
        const { motion, wide } = ctx.conditions;
        if (!motion) return;
        const q = gsap.utils.selector(root.current);

        gsap.from(q('[data-rv="intro"]'), {
          opacity: 0,
          y: 18,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: q('[data-rv="intro"]')[0], start: 'top 88%', once: true },
        });

        q('[data-rv="item"]').forEach((item, index) => {
          gsap.from(item, {
            opacity: 0,
            y: 28,
            duration: 0.9,
            delay: wide ? index * 0.12 : 0,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 88%', once: true },
          });
        });

        if (wide) {
          gsap.from(q('[data-rv="rail"]'), {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.6,
            ease: 'power2.inOut',
            scrollTrigger: { trigger: q('[data-rv="list"]')[0], start: 'top 82%', once: true },
          });
        }

        gsap.from(q('[data-rv="closing"]'), {
          opacity: 0,
          y: 18,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: q('[data-rv="closing"]')[0], start: 'top 92%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="situaciones" className={`${type.section} ${styles.section}`} aria-labelledby="situaciones-title" data-tone="light" ref={root}>
      <div className={type.container}>
        <div className={styles.head}>
          <SectionHead eyebrow={content.eyebrow} title={content.title} id="situaciones-title" className={styles.headMain} />
          <p className={`${type.lead} ${styles.intro}`} data-rv="intro">
            {content.intro}
          </p>
        </div>

        <div className={styles.listWrap} data-rv="list">
          <span className={styles.rail} data-rv="rail" aria-hidden="true" />
          <ol className={styles.list}>
            {content.items.map((item) => (
              <li className={styles.item} key={item.number} data-rv="item">
                <span className={styles.number} aria-hidden="true">
                  {item.number}
                </span>
                <h3 className={styles.label}>{item.label}</h3>
                <p className={styles.text}>{item.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.conclusion} data-rv="closing">
          <p className={styles.closing}>{content.closing}</p>
          <BookingCTA />
        </div>
      </div>
    </section>
  );
}
