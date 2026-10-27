import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import { ClaudiaEditable, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import LifeDiagram from './LifeDiagram.jsx';
import type from './type.module.css';
import styles from './LifeModel.module.css';

const PANEL_ID = 'life-panel';

/**
 * Modelo L.I.F.E. integrado en «Mi enfoque» (no es una sección propia).
 * Un solo diagrama para todos los anchos: seis botones DOM reales, operables con toque, teclado o puntero.
 * Al seleccionar una dimensión aparece su frase breve en un panel de altura estable.
 * GSAP dibuja las líneas al entrar (M03); Motion gestiona solo el estado de selección (M11).
 */
export default function LifeModel({ content: fallback }) {
  const root = useRef(null);
  const { content } = useClaudiaCmsSection('life', { ...fallback, instruction: 'Selecciona una dimensión para explorarla', hubLabel: 'L.I.F.E.' });
  const [selected, setSelected] = useState(null);
  const reduceMotion = useReducedMotion();
  const current = content.dimensions.find(({ id }) => id === selected) ?? null;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root.current);
        const diagram = q('[data-life="diagram"]')[0];
        if (!diagram) return;

        gsap
          .timeline({
            defaults: { ease: 'power2.inOut' },
            scrollTrigger: { trigger: diagram, start: 'top 80%', once: true },
          })
          .from(q('[data-life="draw"]'), { strokeDashoffset: 1, duration: 1.4, stagger: 0.2 }, 0)
          .from(q('[data-life="hub"]'), { opacity: 0, scale: 0.85, duration: 0.8, ease: 'power3.out' }, 0.2)
          .from(q('[data-life="draw-spoke"]'), { strokeDashoffset: 1, duration: 1, stagger: 0.09 }, 0.45)
          .from(q('[data-life="node"]'), { opacity: 0, scale: 0.8, duration: 0.7, stagger: 0.09, ease: 'power3.out' }, 0.8)
          .from(q('[data-life="draw-edge"]'), { strokeDashoffset: 1, duration: 1, stagger: 0.08 }, 1.1);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && selected) setSelected(null);
  };

  return (
    <div className={styles.band} data-tone="white" ref={root}>
      <div className={type.container}>
        <div className={styles.layout} onKeyDown={onKeyDown}>
          <div className={styles.copy}>
            <ClaudiaEditable sectionKey="life" fieldPath="title"><h3 className={styles.title}>{content.title}</h3></ClaudiaEditable>
            <ClaudiaEditable sectionKey="life" fieldPath="intro">
              <div className={styles.intro}>
                {content.intro.split('\n\n').map((paragraph) => <p className={type.lead} key={paragraph}>{paragraph}</p>)}
              </div>
            </ClaudiaEditable>
          </div>

          {/* Desktop: bajo el texto introductorio. Mobile: bajo el diagrama, donde ocurre el toque. */}
          <div className={styles.panel} id={PANEL_ID} aria-live="polite" data-empty={current ? undefined : ''}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current ? current.id : 'hint'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {current ? (
                  <>
                    <p className={styles.panelTitle}>{current.label}</p>
                    <p className={styles.panelText}>{current.text}</p>
                  </>
                ) : (
                  <ClaudiaEditable sectionKey="life" fieldPath="instruction"><p className={styles.instruction}>{content.instruction}</p></ClaudiaEditable>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.stage}>
            <LifeDiagram dimensions={content.dimensions} selected={selected} onSelect={setSelected} panelId={PANEL_ID} cmsSection="life" hubLabel={content.hubLabel} />
          </div>

          {/* Desktop: en la columna del texto, justo bajo el panel. Cada "\n" del copy es una línea propia. */}
          <ClaudiaEditable sectionKey="life" fieldPath="closing">
            <p className={styles.closing}>
              {content.closing.split('\n').map((line) => <span className={styles.closingLine} key={line}>{line}</span>)}
            </p>
          </ClaudiaEditable>
        </div>
      </div>
    </div>
  );
}
