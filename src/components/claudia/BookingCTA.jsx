import { useId } from 'react';
import { motion } from 'motion/react';
import { BOOKING_LABEL, BOOKING_URL } from '../../data/claudia/booking.js';
import styles from './BookingCTA.module.css';

const arrow = {
  rest: { x: 0 },
  hover: { x: 5, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * ÚNICO CTA comercial de la página de Claudia. Etiqueta y destino salen de las constantes
 * centrales y Calendly siempre se abre en una pestaña nueva.
 * variant: 'gold' | 'outline' · size: 'md' | 'lg'
 */
export default function BookingCTA({ variant = 'gold', size = 'md', className = '', label = BOOKING_LABEL, href = BOOKING_URL, ...rest }) {
  const descriptionId = useId();

  return (
    <>
      <motion.a
        className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={descriptionId}
        data-booking-cta
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileFocus="hover"
        whileTap={{ scale: 0.985 }}
        {...rest}
      >
        <span>{label}</span>
        <motion.svg className={styles.arrow} variants={arrow} width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M2 9h13M10 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </motion.svg>
      </motion.a>
      <span id={descriptionId} className="sr-only">
        Se abre en una pestaña nueva.
      </span>
    </>
  );
}
