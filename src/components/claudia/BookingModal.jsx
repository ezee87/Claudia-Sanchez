import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BOOKING_URL } from '../../data/claudia/booking.js';
import styles from './BookingModal.module.css';

const CALENDLY_URL = `${BOOKING_URL}?hide_gdpr_banner=1&primary_color=d5a64a&background_color=f7f5f0&text_color=1b1a44`;
const EXIT_MS = 220;
const SLOW_LOAD_MS = 10000;

const BookingModalContext = createContext({ openBooking: () => {} });

export function useBookingModal() {
  return useContext(BookingModalContext);
}

/** Un único modal de Calendly para todos los CTA de reserva de Claudia. */
export default function BookingModalProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  const exitTimer = useRef(0);

  const openBooking = useCallback((event) => {
    event?.preventDefault?.();
    window.clearTimeout(exitTimer.current);
    triggerRef.current = event?.currentTarget instanceof HTMLElement ? event.currentTarget : document.activeElement;
    setLoaded(false);
    setSlow(false);
    setOpenCount((n) => n + 1);
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setMounted(false), EXIT_MS);
  }, []);

  // Dispara la transición de entrada tras montar.
  useEffect(() => {
    if (!mounted) return undefined;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, [mounted, openCount]);

  useEffect(() => {
    if (!mounted) return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    closeRef.current?.focus({ preventScroll: true });

    // Si el foco se escapa del diálogo (p. ej. desde el iframe) lo devolvemos al botón de cerrar.
    const onFocusIn = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) closeRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('focusin', onFocusIn);

    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_LOAD_MS);

    return () => {
      window.clearTimeout(slowTimer);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [mounted, close]);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  // Los sentinelas cierran el ciclo de Tab, incluso cuando el foco sale del iframe.
  const wrapToStart = () => closeRef.current?.focus();
  const wrapToEnd = () => dialogRef.current?.querySelector('[data-last-focus]')?.focus();

  const value = useMemo(() => ({ openBooking }), [openBooking]);

  return (
    <BookingModalContext.Provider value={value}>
      {children}

      {mounted && (
        <div className={`${styles.overlay} ${visible ? styles.visible : ''}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
          >
            <span tabIndex={0} className={styles.sentinel} onFocus={wrapToEnd} aria-hidden="true" />
            <header className={styles.header}>
              <h2 id="booking-modal-title" className={styles.title}>
                Reservar una sesión estratégica
              </h2>
              <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="Cerrar calendario">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className={styles.body}>
              <iframe
                key={openCount}
                className={styles.frame}
                src={CALENDLY_URL}
                title="Calendario para reservar con Claudia Sánchez"
                allow="payment"
                onLoad={() => setLoaded(true)}
              />
              {!loaded && (
                <div className={styles.status} role="status">
                  <p>{slow ? 'El calendario tarda en cargar.' : 'Cargando calendario…'}</p>
                  {slow && (
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                      Abrir Calendly
                    </a>
                  )}
                </div>
              )}
            </div>

            <footer className={styles.footer}>
              <a data-last-focus href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Si no carga, abrir Calendly directamente
              </a>
            </footer>
            <span tabIndex={0} className={styles.sentinel} onFocus={wrapToStart} aria-hidden="true" />
          </div>
        </div>
      )}
    </BookingModalContext.Provider>
  );
}
