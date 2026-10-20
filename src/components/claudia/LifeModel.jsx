import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import { useMediaQuery } from '../../utils/useMediaQuery.js';
import SectionHead from './SectionHead.jsx';
import LifeDiagram from './LifeDiagram.jsx';
import LifeAccordion from './LifeAccordion.jsx';
import BookingCTA from './BookingCTA.jsx';
import type from './type.module.css';
import styles from './LifeModel.module.css';

const PANEL_ID = 'life-panel';

/**
 * 04 · Modelo L.I.F.E. — segunda gran experiencia.
 * Desktop: diagrama SVG + seis botones DOM y un panel de texto estable. Mobile/tablet: acordeón.
 * GSAP dibuja las líneas al entrar (M03); Motion gestiona solo el estado de selección (M11).
 */
export default function LifeModel({ content }) {
  const root = useRef(null);
  const [selected, setSelected] = useState(null);
  const reduceMotion = useReducedMotion();
  const isDiagram = useMediaQuery('(min-width: 960px)');
  const current = content.dimensions.find(({ id }) => id === selected) ?? null;
  const [closingFirst, closingSecond] = content.closing.split('. ');

  useGSAP(
    () => {
      if (!isDiagram) return undefined;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root.current);
        const diagram = q('[data-life="diagram"]')[0];
        if (!diagram) return;

        gsap
          .timeline({
            defaults: { ease: 'power2.inOut' },
            scrollTrigger: { trigger: diagram, start: 'top 72%', once: true },
          })
          .from(q('[data-life="draw"]'), { strokeDashoffset: 1, duration: 1.4, stagger: 0.2 }, 0)
          .from(q('[data-life="hub"]'), { opacity: 0, scale: 0.85, duration: 0.8, ease: 'power3.out' }, 0.2)
          .from(q('[data-life="draw-spoke"]'), { strokeDashoffset: 1, duration: 1, stagger: 0.09 }, 0.45)
          .from(q('[data-life="node"]'), { opacity: 0, scale: 0.8, duration: 0.7, stagger: 0.09, ease: 'power3.out' }, 0.8)
          .from(q('[data-life="draw-edge"]'), { strokeDashoffset: 1, duration: 1, stagger: 0.08 }, 1.1);
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [isDiagram], revertOnUpdate: true },
  );

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && selected) {
      setSelected(null);
    }
  };

  return (
    <section id="life" className={`${type.section} ${styles.section}`} aria-labelledby="life-title" data-tone="white" ref={root}>
      <div className={type.container}>
        <div className={styles.layout} onKeyDown={onKeyDown}>
          <div className={styles.copy}>
            <SectionHead eyebrow={content.eyebrow} title={content.title} id="life-title" className={styles.head}>
              <p className={type.lead}>{content.intro}</p>
            </SectionHead>

            {isDiagram ? (
              <div className={styles.panel} id={PANEL_ID} aria-live="polite">
                <p className={styles.instruction}>Selecciona una dimensión para explorarla</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={current ? current.id : 'support'}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {current ? (
                      <>
                        <h3 className={styles.panelTitle}>{current.label}</h3>
                        <p className={styles.panelText}>{current.text}</p>
                      </>
                    ) : (
                      <p className={styles.panelSupport}>{content.support}</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <p className={styles.support}>{content.support}</p>
            )}
          </div>

          <div className={styles.stage}>
            {isDiagram ? (
              <LifeDiagram dimensions={content.dimensions} selected={selected} onSelect={setSelected} panelId={PANEL_ID} />
            ) : (
              <LifeAccordion dimensions={content.dimensions} selected={selected} onSelect={setSelected} />
            )}
          </div>
        </div>

        <p className={styles.closing}>
          {closingFirst}.
          <br className={styles.desktopBreak} />{' '}
          {closingSecond}
        </p>
        <div className={styles.action}>
          <BookingCTA />
        </div>
      </div>
    </section>
  );
}
