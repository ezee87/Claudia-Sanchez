import { useRef } from 'react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import { LINKEDIN_RECOMMENDATIONS_URL, LINKEDIN_SOURCE_LABEL } from '../../data/claudia/careerTestimonials.js';
import { bookingLink, careerTestimonialsFallback } from '../../data/claudia/landingCms.js';
import { safeHref, validItems } from '../institutional/content.js';
import { ClaudiaEditable, ClaudiaEditableCollection, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import { resolveCmsLink } from '../../integration/eze-cms/cmsLink.js';
import SectionHead from './SectionHead.jsx';
import BookingCTA from './BookingCTA.jsx';
import type from './type.module.css';
import styles from './CareerTestimonials.module.css';

/**
 * 03 · Testimonios reales: prueba social principal. Una tarjeta destacada a todo el ancho y dos secundarias
 * en paralelo (en mobile, una columna). Sin carrusel; las citas son textuales y todas enlazan a las recomendaciones de LinkedIn.
 */
export default function CareerTestimonials({ content: fallback }) {
  const root = useRef(null);
  const { content } = useClaudiaCmsSection('career-testimonials', careerTestimonialsFallback(fallback));
  const items = validItems(content.items);
  const ctaLink = resolveCmsLink(content.ctaLink, bookingLink);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root.current);
        q('[data-rv="card"]').forEach((card, index) => {
          gsap.from(card, {
            opacity: 0,
            y: 26,
            duration: 0.9,
            delay: index === 2 ? 0.1 : 0,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 90%', once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="testimonios" className={`${type.section} ${styles.section}`} aria-labelledby="testimonios-title" data-tone="light" ref={root}>
      <div className={type.container}>
        <div className={styles.head}>
          <SectionHead eyebrow={content.eyebrow} title={content.title} id="testimonios-title" className={styles.headMain} cmsSection="career-testimonials" />
          <ClaudiaEditable sectionKey="career-testimonials" fieldPath="subtitle"><p className={`${type.lead} ${styles.subtitle}`}>{content.subtitle}</p></ClaudiaEditable>
        </div>

        <ClaudiaEditableCollection sectionKey="career-testimonials" collectionPath="items"><div className={styles.grid}>
          {items.map((item, index) => (
            <ClaudiaEditableCollection key={item._id} sectionKey="career-testimonials" collectionPath="items" itemId={item._id}><figure className={`${styles.card} ${index === 0 ? styles.featured : ''}`} data-rv="card">
              <div className={styles.person}>
                <img src={item.image} alt={item.alt} width="100" height="100" loading="lazy" decoding="async" />
                <figcaption>
                  <strong>{item.author}</strong>
                  <span>{item.role}</span>
                </figcaption>
              </div>
              <blockquote lang={item.lang}>“{item.quote}”</blockquote>
              <a className={styles.source} href={safeHref(item.linkedinUrl, LINKEDIN_RECOMMENDATIONS_URL)} target="_blank" rel="noopener noreferrer">
                <i aria-hidden="true">in</i>
                <span>{item.sourceLabel || LINKEDIN_SOURCE_LABEL}</span>
                <b aria-hidden="true">↗</b>
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            </figure></ClaudiaEditableCollection>
          ))}
        </div></ClaudiaEditableCollection>

        <div className={styles.action}>
          <span className={styles.actionRule} aria-hidden="true" />
          <ClaudiaEditable sectionKey="career-testimonials" fieldPath="closing"><p className={styles.actionText}>{content.closing}</p></ClaudiaEditable>
          <ClaudiaEditable sectionKey="career-testimonials" fieldPath="ctaLink"><BookingCTA size="lg" label={ctaLink.label} href={ctaLink.href} /></ClaudiaEditable>
        </div>
      </div>
    </section>
  );
}
