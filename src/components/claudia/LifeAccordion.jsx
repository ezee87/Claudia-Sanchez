import { AnimatePresence, motion } from 'motion/react';
import { ClaudiaEditable } from '../../integration/eze-cms/ClaudiaCms.jsx';
import styles from './LifeAccordion.module.css';

/** Versión mobile/tablet de L.I.F.E.: acordeón vertical (un solo panel abierto), sin círculo comprimido. */
export default function LifeAccordion({ dimensions, selected, onSelect, cmsSection }) {
  return (
    <ul className={styles.list}>
      {dimensions.map((dimension, index) => {
        const open = selected === dimension.id;
        const buttonId = `life-btn-${dimension.id}`;
        const panelId = `life-acc-${dimension.id}`;
        return (
          <li className={styles.item} key={dimension.id} data-open={open ? '' : undefined}>
            <h3 className={styles.heading}>
              <button
                type="button"
                id={buttonId}
                className={styles.trigger}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => onSelect(open ? null : dimension.id)}
              >
                <ClaudiaEditable sectionKey={cmsSection} fieldPath={`dimensions.${index}.label`}><span>{dimension.label}</span></ClaudiaEditable>
                <span className={styles.icon} aria-hidden="true" />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.panel}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ClaudiaEditable sectionKey={cmsSection} fieldPath={`dimensions.${index}.text`}><p>{dimension.text}</p></ClaudiaEditable>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
