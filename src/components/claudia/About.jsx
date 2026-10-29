import { useRef } from 'react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import { BOOKING_URL } from '../../data/claudia/booking.js';
import { closingFallback } from '../../data/claudia/landingCms.js';
import { ClaudiaEditable, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import { resolveCmsLink } from '../../integration/eze-cms/cmsLink.js';
import SectionHead from './SectionHead.jsx';
import Portrait from './Portrait.jsx';
import BookingCTA from './BookingCTA.jsx';
import type from './type.module.css';
import styles from './About.module.css';

/**
 * 05 · Sobre Claudia + reserva. Credibilidad (M01 + revelado fotográfico M07 simplificado) y, en la misma sección,
 * el cierre de conversión sobre fondo navy con una curva dorada que se dibuja una vez (eco del hero).
 */
export default function About({ content: fallback, closing, portrait }) {
  const root = useRef(null);
  const { content } = useClaudiaCmsSection('about', fallback);
  const { content: reserve } = useClaudiaCmsSection('closing', closingFallback(closing));
  const { content: sharedImages } = useClaudiaCmsSection('hero', { portrait: portrait.src, portraitAlt: portrait.alt });
  const cmsPortrait = { ...portrait, src: sharedImages.portrait, alt: sharedImages.portraitAlt };
  const ctaLink = resolveCmsLink(reserve.ctaLink, { label: reserve.ctaLabel, href: BOOKING_URL });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root.current);

        gsap.from(q('[data-rv="photo"]'), {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 1.5,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: q('[data-rv="photo"]')[0], start: 'top 82%', once: true },
        });
        gsap.from(q('[data-rv="photo-inner"]'), {
          scale: 1.08,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: q('[data-rv="photo"]')[0], start: 'top 82%', once: true },
        });

        gsap.from(q('[data-rv="text"]'), {
          opacity: 0,
          y: 20,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: q('[data-rv="text"]')[0], start: 'top 88%', once: true },
        });

        const reserveTrigger = { trigger: q('[data-rv="reserve"]')[0], start: 'top 75%', once: true };
        gsap.from(q('[data-rv="curve"]'), { strokeDashoffset: 1, duration: 2.2, ease: 'power2.inOut', scrollTrigger: reserveTrigger });
        gsap.from(q('[data-rv="fade"]'), {
          opacity: 0,
          y: 18,
          duration: 0.9,
          stagger: 0.12,
          delay: 0.25,
          ease: 'power3.out',
          scrollTrigger: reserveTrigger,
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="sobre-mi" className={styles.section} aria-labelledby="sobre-title" ref={root}>
      <div className={`${type.section} ${styles.about}`} data-tone="light">
        <div className={`${type.container} ${styles.layout}`}>
          <div className={styles.media}>
            <div className={styles.photo} data-rv="photo">
              <ClaudiaEditable sectionKey="hero" fieldPath="portrait">
                <div className={styles.photoInner} data-rv="photo-inner">
                  <Portrait portrait={cmsPortrait} />
                </div>
              </ClaudiaEditable>
            </div>
          </div>

          <div className={styles.copy}>
            <SectionHead eyebrow={content.eyebrow} title={content.title} id="sobre-title" className={styles.head} cmsSection="about" />

            <div className={styles.paragraphs}>
              {content.paragraphs.map((paragraph, index) => (
                <ClaudiaEditable key={index} sectionKey="about" fieldPath={`paragraphs.${index}`}><p data-rv="text">{paragraph}</p></ClaudiaEditable>
              ))}
            </div>

            <dl className={styles.facts} data-rv="text">
              {content.facts.map((fact, index) => (
                <div key={fact.value}>
                  <ClaudiaEditable sectionKey="about" fieldPath={`facts.${index}.value`}><dt>{fact.value}</dt></ClaudiaEditable>
                  <ClaudiaEditable sectionKey="about" fieldPath={`facts.${index}.label`}><dd>{fact.label}</dd></ClaudiaEditable>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className={`${type.section} ${styles.reserve}`} data-tone="dark" data-rv="reserve">
        <svg className={styles.curve} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <path data-rv="curve" pathLength="1" d="M-40 560 C 360 660, 760 460, 1020 280 S 1320 40, 1480 70" />
        </svg>
        <div className={`${type.container} ${styles.reserveInner}`}>
          <SectionHead eyebrow={reserve.eyebrow} title={reserve.title} id="reservar-title" className={styles.reserveHead} cmsSection="closing" />
          <div className={styles.reserveBody}>
            <ClaudiaEditable sectionKey="closing" fieldPath="text"><p className={`${type.lead} ${styles.reserveText}`} data-rv="fade">{reserve.text}</p></ClaudiaEditable>
            <div className={styles.action} data-rv="fade">
              <ClaudiaEditable sectionKey="closing" fieldPath="ctaLink"><BookingCTA variant="gold" size="lg" label={ctaLink.label} href={ctaLink.href} /></ClaudiaEditable>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
