import Section from '../../components/institutional/Section';
import Seo from '../../components/institutional/Seo';
import { CmsLink, Collection, Field, useSection } from '../../components/institutional/Cms';
import { content as localContent, safeHref, safeImage, validItems } from '../../components/institutional/content';
import './PersonasPage.css';
import TestimonialCard, { LINKEDIN_RECOMMENDATIONS_URL, linkedInUrl } from '../../components/institutional/TestimonialCard';
import { whatsappLinkProps } from '../../data/institutional/whatsapp';
import styles from '../HomePage/HomePage.module.css';

const route = '/personas';
const field = (section, path, child) => <Field route={route} section={section} path={path}>{child}</Field>;

function Hero() {
  const { content: c } = useSection(route, 'hero');
  // Keep the existing CMS title intact, distributing its sentences visually.
  const sentenceEnd = c.title.indexOf('. ');
  const title = sentenceEnd === -1 ? c.title : c.title.slice(0, sentenceEnd + 1);
  const statement = sentenceEnd === -1 ? '' : c.title.slice(sentenceEnd + 2);
  const titleLines = title.match(/^(Tu carrera puede)( seguir evolucionando\.)$/);

  return <section id="hero" className="editorial-section editorial-hero people-hero">
    <div className="people-hero-arcs" aria-hidden="true"><span className="people-hero-dot"/></div>
    <div className="people-hero-lower-arc" aria-hidden="true"/>
    <div className="site-container people-hero-inner">
      <div className="section-heading">
        {field('hero', 'eyebrow', <p className="eyebrow">{c.eyebrow}</p>)}
        {field('hero', 'title', <h1>{titleLines ? <><span className="people-hero-title-line">{titleLines[1]}</span><span className="people-hero-title-line">{titleLines[2]}</span></> : title}</h1>)}
      </div>
      <div className="people-hero-detail">
        {statement && field('hero', 'title', <p className="people-hero-statement">{statement}</p>)}
        <div className="section-copy">
          {field('hero', 'paragraph1', <p>{c.paragraph1}</p>)}
          {field('hero', 'paragraph2', <p>{c.paragraph2}</p>)}
        </div>
        <div className="people-hero-action">
          <CmsLink route={route} section="hero" path="cta" value={c.cta} className="editorial-button"/>
        </div>
      </div>
    </div>
  </section>;
}

function Services() {
  const { content: c } = useSection(route, 'servicios');
  return <section id="servicios" className="editorial-section people-services">
    <div className="site-container">
      {field('servicios', 'title', <h2>{c.title}</h2>)}
      <Collection route={route} section="servicios" path="items">
        <div className="people-services-grid">
          {validItems(c.items).map((item, i) => {
            // Stable identity keeps the program distinct when CMS items are reordered.
            const program = item._id === 'item-3';
            return <Collection key={item._id} route={route} section="servicios" path="items" itemId={item._id}>
              <article className={program ? 'people-program' : 'people-service'} data-tone={program ? 'dark' : undefined}>
                <div className="people-service-heading">
                  <p className="eyebrow people-program-label">
                    <span className="item-number">{String(i + 1).padStart(2, '0')}</span><span aria-hidden="true">·</span>{field('servicios', 'programLabel', <span>{c.programLabel}</span>)}
                  </p>
                  <h3>{item.title}</h3>
                  {item.subtitle && <p className="people-service-subtitle">{item.subtitle}</p>}
                </div>
                <div className="people-service-copy">{item.description?.split('\n\n').map((p, n) => <p key={n}>{p}</p>)}</div>
                {item.label && <a className="editorial-button" href={safeHref(item.href, '/contacto?tipo=persona')} {...whatsappLinkProps(item.href)}>
                  {item.label}<span aria-hidden="true">↗</span>
                </a>}
              </article>
            </Collection>;
          })}
        </div>
      </Collection>
    </div>
  </section>;
}

function Approach() {
  const { content: c } = useSection(route, 'enfoque');
  return <section id="enfoque" className="editorial-section people-approach" data-tone="dark">
    <div className="site-container">
      <div className="people-approach-heading">
        {field('enfoque', 'eyebrow', <p className="eyebrow people-approach-label">{c.eyebrow}</p>)}
        {field('enfoque', 'title', <h2>{c.title}</h2>)}
        {field('enfoque', 'paragraph3', <p>{c.paragraph3}</p>)}
      </div>
      <ol className="people-steps">
        <li><span className="item-number" aria-hidden="true"><span>01</span></span><div className="people-step-content">{field('enfoque', 'step1Title', <h3>{c.step1Title}</h3>)}
          {field('enfoque', 'paragraph1', <p>{c.paragraph1}</p>)}
        </div></li>
        <li><span className="item-number" aria-hidden="true"><span>02</span></span><div className="people-step-content">{field('enfoque', 'step2Title', <h3>{c.step2Title}</h3>)}
          {field('enfoque', 'paragraph2', <p>{c.paragraph2}</p>)}
        </div></li>
        <li><span className="item-number" aria-hidden="true"><span>03</span></span><div className="people-step-content">{field('enfoque', 'step3Title', <h3>{c.step3Title}</h3>)}
          {field('enfoque', 'paragraph4', <p>{c.paragraph4}</p>)}
        </div></li>
      </ol>
    </div>
  </section>;
}

function Testimonials() {
  const { content: c } = useSection(route, 'testimonios');
  const portraits = Object.fromEntries(localContent[route].testimonios.items.map(item => [item.author, item.image]));
  return <section id="testimonios" className="editorial-section people-testimonials" aria-labelledby="people-testimonials-title"><div className="site-container">
    <div className={styles.testimonialsHead}><div className={styles.sectionTitle}>
      {field('testimonios', 'eyebrow', <p className={styles.kicker}>{c.eyebrow}</p>)}
      {field('testimonios', 'title', <h2 id="people-testimonials-title">{c.title}</h2>)}
    </div>{field('testimonios', 'paragraph1', <p>{c.paragraph1.replace(/^(Cada trayectoria es diferente\.)\s*/, '$1\n')}</p>)}</div>
    <Collection route={route} section="testimonios" path="items"><div className={styles.testimonialGrid}>
      {validItems(c.items).map((item, index) => <TestimonialCard key={item._id} route={route} item={item} index={index} portrait={safeImage(item.image, portraits[item.author] || '')} source={linkedInUrl(item.linkedinUrl) || LINKEDIN_RECOMMENDATIONS_URL} className="people-testimonial-card" />)}
    </div></Collection>
  </div></section>;
}

function Contact() {
  const { content: c } = useSection(route, 'contacto');
  const { content: homeContact } = useSection('/', 'contacto');
  const background = safeImage(homeContact.image, localContent['/'].contacto.image);
  const titleLines = c.title.match(/^(¿Qué te gustaría construir) (en tu siguiente etapa\?)$/);

  return <section id="contacto" className={`${styles.section} ${styles.contact} people-contact`} aria-labelledby="people-contact-title">
    <div className={styles.contactBackdrop} aria-hidden="true" style={{ backgroundImage: `url("${background}")` }} />
    <div className={`site-container ${styles.contactInner}`}>
      {field('contacto', 'eyebrow', <div className={styles.contactMark} aria-hidden="true"><span>{c.eyebrow}</span></div>)}
      <div className={`${styles.contactContent} people-contact-content`}>
        {field('contacto', 'title', <h2 id="people-contact-title">{titleLines ? <><span className="people-contact-title-line">{titleLines[1]}</span>{' '}<span className="people-contact-title-line">{titleLines[2]}</span></> : c.title}</h2>)}
        <div className={`${styles.contactCopy} people-contact-copy`}>
          {field('contacto', 'paragraph1', <p>{c.paragraph1}</p>)}
          {field('contacto', 'paragraph2', <p>{c.paragraph2}</p>)}
        </div>
        <div><CmsLink route={route} section="contacto" path="cta" value={c.cta} className="editorial-button" /></div>
      </div>
    </div>
  </section>;
}

export default function PersonasPage() {
  return <div className="people-page">
    <Seo route={route}/>
    <Hero/>
    <Section route={route} section="situaciones"/>
    <Services/>
    <Approach/>
    <Testimonials/>
    <Contact/>
  </div>;
}
