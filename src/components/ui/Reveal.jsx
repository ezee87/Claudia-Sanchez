import { motion, useReducedMotion } from 'motion/react';
import styles from './Reveal.module.css';

const EASE = [0.22, 1, 0.36, 1];

/** M01 — Editorial Reveal: titulares palabra por palabra detrás de una máscara. Usar con criterio. */
export function RevealText({ children, as: Tag = 'span', className = '', delay = 0, ...rest }) {
  const reduce = useReducedMotion();
  const words = String(children).split(' ');

  if (reduce) {
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag className={className} {...rest}>
      {words.map((word, i) => (
        <span key={i}>
          <span className={styles.mask}>
            <motion.span
              className={styles.word}
              data-reveal
              initial={{ y: '112%' }}
              whileInView={{ y: '0%' }}
              viewport={{ once: true, margin: '0px 0px -12% 0px' }}
              transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.045 }}
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}

/** Revelado carácter por carácter para cifras (el precio es el evento visual). */
export function RevealChars({ children, className = '', ...rest }) {
  const reduce = useReducedMotion();
  const text = String(children);

  if (reduce) {
    return (
      <span className={className} {...rest}>
        {text}
      </span>
    );
  }

  return (
    <span className={className} {...rest}>
      <span className="sr-only">{text}</span>
      {Array.from(text).map((char, i) => (
        <span className={styles.mask} key={i} aria-hidden="true">
          <motion.span
            className={styles.word}
            data-reveal
            initial={{ y: '112%' }}
            whileInView={{ y: '0%' }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 1, ease: EASE, delay: i * 0.07 }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Aparición breve de un bloque (opacidad + desplazamiento mínimo). */
export function Fade({ children, as = 'div', delay = 0, y = 14, className = '', ...rest }) {
  const reduce = useReducedMotion();
  const Comp = motion[as] ?? motion.div;

  if (reduce) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <Comp
      className={className}
      data-reveal
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
