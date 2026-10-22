import { useRef } from 'react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import { BOOKING_LABEL, BOOKING_URL } from '../../data/claudia/booking.js';
import { ClaudiaEditable, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import { resolveCmsLink } from '../../integration/eze-cms/cmsLink.js';
import BookingCTA from './BookingCTA.jsx';
import SectionHead from './SectionHead.jsx';
import type from './type.module.css';
import styles from './Closing.module.css';

/** 06 · Conversión. M01 editorial; una curva dorada fina que se dibuja una sola vez (eco del hero). */
export default function Closing({ content: fallback }) {
  const root = useRef(null);
  const { content } = useClaudiaCmsSection('closing', { ...fallback, ctaLabel: BOOKING_LABEL, ctaLink: null });
  const ctaLink = resolveCmsLink(content.ctaLink, { label: content.ctaLabel, href: BOOKING_URL });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root.current);
        const trigger = { trigger: root.current, start: 'top 70%', once: true };

        gsap.from(q('[data-rv="curve"]'), { strokeDashoffset: 1, duration: 2.2, ease: 'power2.inOut', scrollTrigger: trigger });
        gsap.from(q('[data-rv="fade"]'), {
          opacity: 0,
          y: 18,
          duration: 0.9,
          stagger: 0.12,
          delay: 0.35,
          ease: 'power3.out',
          scrollTrigger: trigger,
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="reservar" className={`${type.section} ${styles.section}`} aria-labelledby="reservar-title" data-tone="dark" ref={root}>
      <svg className={styles.curve} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <path data-rv="curve" pathLength="1" d="M-40 520 C 360 640, 700 420, 980 260 S 1300 40, 1480 80" />
      </svg>

      <div className={`${type.container} ${styles.inner}`}>
        <SectionHead eyebrow={content.eyebrow} title={content.title} id="reservar-title" className={styles.head} cmsSection="closing" />
        <ClaudiaEditable sectionKey="closing" fieldPath="text"><p className={`${type.lead} ${styles.text}`} data-rv="fade">{content.text}</p></ClaudiaEditable>
        <div data-rv="fade" className={styles.action}>
          <ClaudiaEditable sectionKey="closing" fieldPath="ctaLink"><BookingCTA variant="ivory" size="lg" label={ctaLink.label} href={ctaLink.href} /></ClaudiaEditable>
        </div>
      </div>
    </section>
  );
}
