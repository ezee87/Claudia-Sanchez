import { Collection } from './Cms';
import styles from '../../pages/HomePage/HomePage.module.css';

export const LINKEDIN_RECOMMENDATIONS_URL = 'https://www.linkedin.com/in/claudiasanchezurencio/details/recommendations/?detailScreenTabIndex=0';

export default function TestimonialCard({ route, item, index, portrait, source, reveal, initials, note, quoteLang, className = '' }) {
  return <Collection route={route} section="testimonios" path="items" itemId={item._id}><figure className={`${styles.testimonialCard} ${index === 0 ? styles.featuredQuote : ''} ${className}`} data-reveal={reveal || undefined}>
      <div className={styles.testimonialContent}>
        <div className={styles.person}>{portrait ? <img src={portrait} alt={item.alt || `Retrato de ${item.author}`} width="112" height="112" loading="lazy" /> : initials ? <span className="testimonial-initials" aria-hidden="true">{initials}</span> : null}<figcaption><strong>{item.author}</strong>{item.role && <span>{item.role}</span>}</figcaption></div>
        <blockquote lang={quoteLang}>“{item.quote}”</blockquote>
        {note && <p className="testimonial-note">{note}</p>}
        {source && <a className={styles.linkedinSource} href={source} target="_blank" rel="noopener noreferrer"><i aria-hidden="true">in</i><span>{item.sourceLabel || 'RECOMENDACIÓN PÚBLICA EN LINKEDIN'}</span><b aria-hidden="true">↗</b><span className="sr-only"> (se abre en una pestaña nueva)</span></a>}
      </div>
      </figure></Collection>;
}
