import { BOOKING_URL, LINKEDIN_URL } from '../../data/claudia/booking.js';
import styles from './SiteFooter.module.css';

export default function SiteFooter({ brand, content, nav }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.main}>
          <div className={styles.identity}>
            <p className={styles.brand}>{brand}</p>
            <p className={styles.line}>{content.line.replace(`${brand} · `, '')}</p>
            <p className={styles.description}>{content.description}</p>
          </div>

          <nav className={styles.nav} aria-label="Navegación del pie de página">
            <p className={styles.heading}>Explorar</p>
            {nav.map((item) => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}
          </nav>

          <div className={styles.contact}>
            <p className={styles.heading}>Conectar</p>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M5.1 3.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM3.7 8h2.8v12H3.7V8Zm5 0h2.7v1.6c.5-1 1.6-1.9 3.5-1.9 3 0 4.1 1.8 4.1 4.7V20h-2.9v-6.3c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V20H8.7V8Z" /></svg>
              LinkedIn<span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M7 3v4M17 3v4M3 10h18M8 15h3" /></svg>
              Calendly<span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>{content.copyright} {brand}</p>
        </div>
      </div>
    </footer>
  );
}
