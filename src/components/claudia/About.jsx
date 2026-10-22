import { useRef } from 'react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import { ClaudiaEditable, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import SectionHead from './SectionHead.jsx';
import Portrait from './Portrait.jsx';
import type from './type.module.css';
import styles from './About.module.css';

/** 05 · Sobre Claudia. M01 + revelado fotográfico M07 simplificado (clip-path del contenedor; el rostro nunca se deforma). */
export default function About({ content: fallback, portrait }) {
  const root = useRef(null);
  const { content } = useClaudiaCmsSection('about', fallback);
  const { content: sharedImages } = useClaudiaCmsSection('hero', { portrait: portrait.src });
  const cmsPortrait = { ...portrait, src: sharedImages.portrait };

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
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="sobre-mi" className={`${type.section} ${styles.section}`} aria-labelledby="sobre-title" data-tone="light" ref={root}>
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
    </section>
  );
}
