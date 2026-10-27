import { BOOKING_URL, LINKEDIN_URL } from '../../data/claudia/booking.js';
import { ClaudiaEditable, useClaudiaCmsSection } from '../../integration/eze-cms/ClaudiaCms.jsx';
import { resolveCmsLink } from '../../integration/eze-cms/cmsLink.js';
import BackToTop from '../ui/BackToTop.jsx';
import styles from './SiteFooter.module.css';

export default function SiteFooter({ brand, content, nav }) {
  const { content: cmsContent } = useClaudiaCmsSection('site-footer', {
    brand,
    line: content.line.replace(`${brand} · `, ''),
    description: content.description,
    copyright: content.copyright,
    exploreHeading: 'Explorar',
    connectHeading: 'Conectar',
    homeLink: null,
    linkedinLink: null,
    calendlyLink: null,
  });
  const homeLink = resolveCmsLink(cmsContent.homeLink, { label: 'Inicio', href: '/' });
  const linkedinLink = resolveCmsLink(cmsContent.linkedinLink, { label: 'LinkedIn', href: LINKEDIN_URL });
  const calendlyLink = resolveCmsLink(cmsContent.calendlyLink, { label: 'Calendly', href: BOOKING_URL });
  const navLinks = nav.map((item, index) => ({
    id: item.id,
    ...resolveCmsLink(cmsContent[`navLink${index}`], { label: item.label, href: `#${item.id}` }),
  }));
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.main}>
          <div className={styles.identity}>
            <ClaudiaEditable sectionKey="site-footer" fieldPath="brand"><p className={styles.brand}>{cmsContent.brand}</p></ClaudiaEditable>
            <ClaudiaEditable sectionKey="site-footer" fieldPath="line"><p className={styles.line}>{cmsContent.line}</p></ClaudiaEditable>
            <ClaudiaEditable sectionKey="site-footer" fieldPath="description"><p className={styles.description}>{cmsContent.description}</p></ClaudiaEditable>
          </div>

          <nav className={styles.nav} aria-label="Navegación del pie de página">
            <ClaudiaEditable sectionKey="site-footer" fieldPath="exploreHeading"><p className={styles.heading}>{cmsContent.exploreHeading}</p></ClaudiaEditable>
            <ClaudiaEditable sectionKey="site-footer" fieldPath="homeLink"><a href={homeLink.href}>{homeLink.label}</a></ClaudiaEditable>
            {navLinks.map((link, index) => {
              return <ClaudiaEditable key={link.id} sectionKey="site-footer" fieldPath={`navLink${index}`}><a href={link.href}>{link.label}</a></ClaudiaEditable>;
            })}
          </nav>

          <div className={styles.contact}>
            <ClaudiaEditable sectionKey="site-footer" fieldPath="connectHeading"><p className={styles.heading}>{cmsContent.connectHeading}</p></ClaudiaEditable>
            <ClaudiaEditable sectionKey="site-footer" fieldPath="linkedinLink"><a href={linkedinLink.href} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M5.1 3.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM3.7 8h2.8v12H3.7V8Zm5 0h2.7v1.6c.5-1 1.6-1.9 3.5-1.9 3 0 4.1 1.8 4.1 4.7V20h-2.9v-6.3c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V20H8.7V8Z" /></svg>
              <span>{linkedinLink.label}</span><span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a></ClaudiaEditable>
            <ClaudiaEditable sectionKey="site-footer" fieldPath="calendlyLink"><a href={calendlyLink.href} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M7 3v4M17 3v4M3 10h18M8 15h3" /></svg>
              <span>{calendlyLink.label}</span><span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a></ClaudiaEditable>
          </div>
        </div>
        <div className={styles.bottom}>
          <ClaudiaEditable sectionKey="site-footer" fieldPath="copyright"><p>{cmsContent.copyright} {cmsContent.brand}</p></ClaudiaEditable>
          <BackToTop tone="light" />
        </div>
      </div>
    </footer>
  );
}
