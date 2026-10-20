import { useRef } from 'react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import BookingCTA from './BookingCTA.jsx';
import styles from './Hero.module.css';

/** Portada editorial de la demo; usa el recorte transparente original de Claudia. */
export default function Hero({ hero, portrait }) {
  const root = useRef(null);
  const introduction = hero.titleLines.slice(0, hero.accentFrom).join(' ');
  const [accentLead, ...accentTail] = hero.titleLines.slice(hero.accentFrom).join(' ').split(' ');

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root.current);
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from(q('[data-hero="eyebrow"]'), { opacity: 0, y: 12, duration: 0.6 }, 0.05)
          .from(q('[data-hero="intro"]'), { opacity: 0, y: 18, duration: 0.8 }, 0.16)
          .from(q('[data-hero="title"]'), { opacity: 0, y: 18, duration: 0.9 }, 0.32)
          .from(q('[data-hero="portrait"]'), { opacity: 0, y: 24, duration: 1.15 }, 0.32)
          .from(q('[data-hero="description"]'), { opacity: 0, y: 14, duration: 0.7 }, 0.82)
          .from(q('[data-hero="cta"]'), { opacity: 0, y: 12, duration: 0.65 }, 1.02)
          .from(q('[data-hero="descriptor"]'), { opacity: 0, duration: 0.65 }, 1.18)
          .from(q('[data-hero="curve"]'), { strokeDashoffset: 1, duration: 1.8, ease: 'power2.inOut' }, 0.28);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section className={styles.hero} id="inicio" ref={root} aria-labelledby="hero-title" data-tone="dark">
      <svg className={styles.curve} viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path data-hero="curve" pathLength="1" d="M 820 840 C 790 590, 930 415, 1120 355 S 1320 165, 1490 160" />
      </svg>

      <div className={styles.copy}>
        <p className={styles.eyebrow} data-hero="eyebrow">{hero.eyebrow}</p>
        <p className={styles.introduction} data-hero="intro">{introduction}</p>

        <h1 className={styles.title} id="hero-title">
          <span className={styles.titleLine} data-hero="title">
            {accentLead}<span className={styles.titleTail}> {accentTail.join(' ')}</span>
          </span>
        </h1>

        <p className={styles.subtitle} data-hero="description">{hero.subtitle}</p>
        <div className={styles.action} data-hero="cta"><BookingCTA variant="gold" size="lg" /></div>
        <p className={styles.complement} data-hero="descriptor">{hero.complement}</p>
      </div>

      <div className={styles.media} data-hero="portrait">
        <img
          className={styles.portrait}
          src={portrait.src}
          alt={portrait.alt}
          width="1198"
          height="1313"
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}
