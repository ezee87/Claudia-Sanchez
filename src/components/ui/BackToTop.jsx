import styles from './BackToTop.module.css';

/** Desplaza la página al inicio; suave salvo que el usuario pida reducir el movimiento. */
export function scrollToTop() {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
}

/** Botón cuadrado con flecha hacia arriba (footer y menú mobile). `tone="light"` para fondos claros. */
export default function BackToTop({ className = '', tone, label = 'Volver al inicio', onClick = scrollToTop }) {
  return (
    <button
      type="button"
      className={`${styles.button} ${className}`.trim()}
      data-tone={tone}
      aria-label={label}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
    </button>
  );
}
