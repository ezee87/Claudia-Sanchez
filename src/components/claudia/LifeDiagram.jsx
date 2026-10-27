import { motion } from 'motion/react';
import { useMediaQuery } from '../../utils/useMediaQuery.js';
import { ClaudiaEditable } from '../../integration/eze-cms/ClaudiaCms.jsx';
import styles from './LifeDiagram.module.css';

// Geometría en % del lado del diagrama. En pantallas estrechas los nodos crecen para que las etiquetas
// (p. ej. RELACIONES) quepan y el área táctil siga siendo cómoda.
const GEOMETRY = { regular: { radius: 36, node: 19 }, compact: { radius: 33, node: 27 } };
const START = -90;

function polar(index, count, radius) {
  const angle = ((START + (360 / count) * index) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
}

const NODE_REST = { scale: 1, backgroundColor: '#fbfaf7', color: '#1b1a44', borderColor: '#1b1a44' };
const NODE_ACTIVE = { scale: 1.07, backgroundColor: '#1b1a44', color: '#d5a64a', borderColor: '#1b1a44' };

/**
 * Diagrama L.I.F.E.: composición SVG (líneas, dibujadas con GSAP) + seis botones DOM reales (estado con Motion).
 * Las dimensiones no son etapas: no hay numeración ni orden de lectura obligatorio.
 */
export default function LifeDiagram({ dimensions, selected, onSelect, panelId, cmsSection, hubLabel }) {
  const compact = useMediaQuery('(max-width: 599.98px)');
  const { radius, node: nodeSize } = compact ? GEOMETRY.compact : GEOMETRY.regular;
  const points = dimensions.map((_, index) => polar(index, dimensions.length, radius));
  const hexagon = points.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`);

  return (
    <div className={styles.diagram} data-life="diagram" data-compact={compact ? '' : undefined}>
      <svg className={styles.svg} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <polygon className={styles.hexagon} points={hexagon.join(' ')} />
        <circle className={styles.ring} data-life="draw" pathLength="1" cx="50" cy="50" r="47.5" />
        {points.map((point, index) => {
          const next = points[(index + 1) % points.length];
          return (
            <line
              className={styles.edge}
              data-life="draw-edge"
              pathLength="1"
              key={`edge-${dimensions[index].id}`}
              x1={point.x}
              y1={point.y}
              x2={next.x}
              y2={next.y}
            />
          );
        })}
        {points.map((point, index) => (
          <line
            className={`${styles.spoke} ${selected === dimensions[index].id ? styles.spokeActive : ''}`}
            data-life="draw-spoke"
            pathLength="1"
            key={`spoke-${dimensions[index].id}`}
            x1="50"
            y1="50"
            x2={point.x}
            y2={point.y}
          />
        ))}
        <circle className={styles.hubRing} data-life="draw" pathLength="1" cx="50" cy="50" r="15.5" />
      </svg>

      <div className={styles.hub} data-life="hub">
        <ClaudiaEditable sectionKey={cmsSection} fieldPath="hubLabel"><span>{hubLabel}</span></ClaudiaEditable>
      </div>

      {dimensions.map((dimension, index) => {
        const { x, y } = points[index];
        const isSelected = selected === dimension.id;
        return (
          <span
            className={styles.slot}
            data-life="node"
            key={dimension.id}
            style={{ left: `${x - nodeSize / 2}%`, top: `${y - nodeSize / 2}%`, width: `${nodeSize}%` }}
          >
            <motion.button
              type="button"
              className={styles.node}
              aria-pressed={isSelected}
              aria-controls={panelId}
              onClick={() => onSelect(isSelected ? null : dimension.id)}
              initial={false}
              animate={isSelected ? NODE_ACTIVE : NODE_REST}
              whileHover={isSelected ? undefined : { scale: 1.05, borderColor: '#d5a64a' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              <ClaudiaEditable sectionKey={cmsSection} fieldPath={`dimensions.${index}.label`}><span>{dimension.label}</span></ClaudiaEditable>
            </motion.button>
          </span>
        );
      })}
    </div>
  );
}
