import { Fragment, useRef } from 'react';
import { gsap, useGSAP, MQ } from '../../utils/gsap.js';
import { BOOKING_URL } from '../../data/claudia/booking.js';
import { LANDING_ROUTE, heroFallback } from '../../data/claudia/landingCms.js';
import { resolveCmsLink } from '../../integration/eze-cms/cmsLink.js';
import { CmsEditable } from '../../integration/eze-cms/CmsEditable';
import { cmsRuntimeConfig, readCmsSection } from '../../integration/eze-cms/cmsRuntime';
import { useCmsSection } from '../../integration/eze-cms/useCmsSection';
import BookingCTA from './BookingCTA.jsx';
import styles from './Hero.module.css';

const PAGE_ROUTE = LANDING_ROUTE;
const SECTION_KEY = 'hero';

/** Portada editorial de la demo; usa el recorte transparente original de Claudia. */
export default function Hero({ hero, portrait }) {
  const root = useRef(null);
  const localContent = heroFallback(hero, portrait);
  const { content } = useCmsSection({
    config: cmsRuntimeConfig,
    pageRoute: PAGE_ROUTE,
    sectionKey: SECTION_KEY,
    fallback: localContent,
    readSection: readCmsSection,
  });
  const ctaLink = resolveCmsLink(content.ctaLink, { label: content.ctaLabel, href: BOOKING_URL });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(root.current);
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from(q('[data-hero="eyebrow"]'), { opacity: 0, y: 12, duration: 0.6 }, 0.05)
          .from(q('[data-hero="intro"]'), { opacity: 0, y: 18, duration: 0.8 }, 0.16)
          .from(q('[data-hero="title"]'), { opacity: 0, y: 18, duration: 0.9 }, 0.32)
          .from(q('[data-hero="portrait"]'), { opacity: 0, y: 24, duration: 1.15 }, 0.32)
          .from(q('[data-hero="description"]'), { opacity: 0, y: 14, duration: 0.7 }, 0.82)
          .from(q('[data-hero="cta"]'), { opacity: 0, y: 12, duration: 0.65 }, 1.02)
          .from(q('[data-hero="descriptor"]'), { opacity: 0, duration: 0.65 }, 1.18)
          .from(q('[data-hero="curve"]'), { strokeDashoffset: 1, duration: 1.8, ease: 'power2.inOut' }, 0.28);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section className={styles.hero} id="inicio" ref={root} aria-labelledby="hero-title" data-tone="dark">
      <svg className={styles.curve} viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path data-hero="curve" pathLength="1" d="M 820 840 C 790 590, 930 415, 1120 355 S 1320 165, 1490 160" />
      </svg>

      <div className={styles.copy}>
        <CmsEditable config={cmsRuntimeConfig} pageRoute={PAGE_ROUTE} sectionKey={SECTION_KEY} fieldPath="eyebrow">
          <p className={styles.eyebrow} data-hero="eyebrow">
            {/* Desktop: una línea con « · ». Mobile: nombre y cargo en dos líneas, sin separador. */}
            {content.eyebrow.split(' · ').map((part, index) => (
              <Fragment key={index}>
                {index > 0 && <span className={styles.eyebrowSep}> · </span>}
                <span className={styles.eyebrowLine}>{part}</span>
              </Fragment>
            ))}
          </p>
        </CmsEditable>
        <h1 className={styles.title} id="hero-title">
          <CmsEditable config={cmsRuntimeConfig} pageRoute={PAGE_ROUTE} sectionKey={SECTION_KEY} fieldPath="title">
            <span className={styles.titleLead} data-hero="intro">{content.title}</span>
          </CmsEditable>{' '}
          <CmsEditable config={cmsRuntimeConfig} pageRoute={PAGE_ROUTE} sectionKey={SECTION_KEY} fieldPath="highlightedTitle">
            <span className={styles.titleAccent} data-hero="title">{content.highlightedTitle}</span>
          </CmsEditable>
        </h1>

        <CmsEditable config={cmsRuntimeConfig} pageRoute={PAGE_ROUTE} sectionKey={SECTION_KEY} fieldPath="description">
          <p className={styles.subtitle} data-hero="description">{content.description}</p>
        </CmsEditable>
        <div className={styles.action} data-hero="cta">
          <CmsEditable config={cmsRuntimeConfig} pageRoute={PAGE_ROUTE} sectionKey={SECTION_KEY} fieldPath="ctaLink">
            <BookingCTA variant="gold" size="lg" label={ctaLink.label} href={ctaLink.href} />
          </CmsEditable>
        </div>
        <CmsEditable config={cmsRuntimeConfig} pageRoute={PAGE_ROUTE} sectionKey={SECTION_KEY} fieldPath="complement">
          <p className={styles.complement} data-hero="descriptor">{content.complement}</p>
        </CmsEditable>
      </div>

      <div className={styles.media} data-hero="portrait">
        <CmsEditable config={cmsRuntimeConfig} pageRoute={PAGE_ROUTE} sectionKey={SECTION_KEY} fieldPath="portrait">
          <img
            className={styles.portrait}
            src={content.portrait}
            alt={content.portraitAlt}
            width="1198"
            height="1313"
            decoding="async"
            loading="eager"
            fetchPriority="high"
          />
        </CmsEditable>
      </div>
    </section>
  );
}
