import styles from './Portrait.module.css';

/**
 * Retrato de Claudia. Con `portrait.src` muestra la foto real (sin distorsión: object-fit cover);
 * sin foto muestra un placeholder honesto y reemplazable. Nunca una persona generada.
 */
export default function Portrait({ portrait, priority = false, className = '' }) {
  const { src, alt, width, height, placeholderLabel } = portrait;

  return (
    <div className={`${styles.frame} ${className}`} style={{ '--ar': `${width} / ${height}` }} data-portrait>
      {src ? (
        <img
          className={styles.image}
          src={src}
          alt={alt}
          width={width}
          height={height}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />
      ) : (
        <div className={styles.placeholder} role="img" aria-label={`${alt}: ${placeholderLabel.toLowerCase()}.`}>
          <svg className={styles.arch} viewBox="0 0 100 125" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <path d="M4 135 C 6 108, 26 94, 50 94 S 94 108, 96 135 Z" />
            <ellipse cx="50" cy="64" rx="14" ry="18" />
          </svg>
          <span className={styles.tag}>{placeholderLabel}</span>
        </div>
      )}
    </div>
  );
}
