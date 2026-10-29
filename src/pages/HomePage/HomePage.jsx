import { useRef } from 'react';
import { gsap, MQ, useGSAP } from '../../utils/gsap';
import { ArticleCards } from '../../components/institutional/articles';
import { CmsLink, Collection, Field, SectionBlock, useSection } from '../../components/institutional/Cms';
import { content as localContent, safeHref, safeImage, validItems } from '../../components/institutional/content';
import Seo from '../../components/institutional/Seo';
import TestimonialCard, { LINKEDIN_RECOMMENDATIONS_URL, linkedInUrl } from '../../components/institutional/TestimonialCard';
import styles from './HomePage.module.css';

const ROUTE = '/';
const HERO_DESCRIPTION = 'Acompaño a líderes, ejecutivos y organizaciones a reconocer nuevas posibilidades, tomar mejores decisiones y avanzar con claridad, combinando más de 20 años de experiencia corporativa con una mirada estratégica y humana.';
const LEGACY_HERO_DESCRIPTION = 'Acompaño a líderes, ejecutivos y organizaciones en momentos de desarrollo, transformación y cambio.';
const LEGACY_COMMUNITY_DESCRIPTION = 'Experiencias grupales e inmersivas para pensar la carrera y el liderazgo fuera de la operación.';
const COMMUNITY_DESCRIPTION = 'Espacios de encuentro y experiencias grupales para ejecutivos y líderes que buscan ampliar su perspectiva, reflexionar sobre su siguiente etapa y explorar nuevas posibilidades. A través de conversaciones, aprendizaje compartido y experiencias inmersivas, propongo salir de la dinámica cotidiana para conectar con nuevas ideas, fortalecer relaciones y tomar decisiones con mayor claridad.';
const TESTIMONIAL_PORTRAITS = {
  'Aldo Barrios': '/assets/claudia-sanchez/testimonials/aldo-barrios.jpg',
  'Dulce Cano': '/assets/claudia-sanchez/testimonials/dulce-cano.jpg',
  'Eduardo Díaz Cortazar': '/assets/claudia-sanchez/testimonials/eduardo-diaz.jpg',
};

function splitTitle(title = '') {
  const comma = title.indexOf(',');
  if (comma > 0) {
    const lead = title.slice(0, comma + 1);
    const rest = title.slice(comma + 1).trim();
    const finalLine = rest.search(/\sy\s+(?=estrategia|transformación|carrera)/i);
    return finalLine > 0
      ? [lead, rest.slice(0, finalLine).trim(), rest.slice(finalLine + 1).trim()]
      : [lead, rest, ''];
  }
  const words = title.split(' ');
  const cut = Math.min(3, Math.ceil(words.length / 2));
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' '), ''];
}

function SectionTitle({ section, eyebrow, title, id, className = '' }) {
  return <header className={`${styles.sectionTitle} ${className}`} data-reveal>
    {eyebrow && <Field route={ROUTE} section={section} path="eyebrow"><p className={styles.kicker}>{eyebrow}</p></Field>}
    <Field route={ROUTE} section={section} path="title"><h2 id={id}>{title}</h2></Field>
  </header>;
}

function Hero() {
  const { content } = useSection(ROUTE, 'hero');
  const [lead, middle, end] = splitTitle(content.title);
  const description = content.paragraph2 || content.paragraph1 === LEGACY_HERO_DESCRIPTION ? HERO_DESCRIPTION : content.paragraph1;
  const cmsImage = safeImage(content.image, '/assets/claudia-sanchez/claudia-bg-hero.png');
  const image = cmsImage.endsWith('/claudia-hero.png') ? '/assets/claudia-sanchez/claudia-bg-hero.png' : cmsImage;
  return <section className={styles.hero} aria-labelledby="home-hero-title" data-home-hero>
    <Field route={ROUTE} section="hero" path="image"><div className={styles.heroBackdrop} data-hero-backdrop role="img" aria-label={content.alt || 'Claudia Sánchez Urencio'} style={{ backgroundImage: `url("${image}")` }} /></Field>
    <div className={styles.heroCopy}>
      <Field route={ROUTE} section="hero" path="title"><h1 id="home-hero-title" data-hero-item><span>{lead}</span>{middle && <em>{middle}</em>}{end && <em>{end}</em>}</h1></Field>
      <div className={styles.heroIntro} data-hero-item>
        <Field route={ROUTE} section="hero" path="paragraph1"><p>{description}</p></Field>
      </div>
      <div className={styles.heroAction} data-hero-item><CmsLink route={ROUTE} section="hero" path="cta" value={content.cta} className="editorial-button" /></div>
    </div>
  </section>;
}

function Trajectory() {
  const { content } = useSection(ROUTE, 'sobre-mi');
  const local = localContent[ROUTE]['sobre-mi'];
  const field = (path, child) => <Field route={ROUTE} section="sobre-mi" path={path}>{child}</Field>;
  const metric = field('metricValue', <strong className={styles.pathMetric}>{content.metricValue}{field('metricSuffix', <span>{content.metricSuffix}</span>)}</strong>);
  // `\n` separa las dos líneas que el diseño de escritorio muestra en la cifra y en la línea regional.
  const [metricLead, metricTail] = content.metricLabel.split('\n');
  const [regionLead, regionTail] = content.regionLineDesktop.split('\n');
  const logos = (ampClass) => <>
    {field('primaryLogo', <img className={styles.diageoLogo} src={safeImage(content.primaryLogo, local.primaryLogo)} alt={content.primaryLogoAlt} />)}
    <span className={ampClass} aria-hidden="true">&amp;</span>
    {field('secondaryLogo', <img className={styles.kraftLogo} src={safeImage(content.secondaryLogo, local.secondaryLogo)} alt={content.secondaryLogoAlt} />)}
  </>;
  return <section id="sobre-mi" className={`${styles.section} ${styles.trajectory}`} aria-labelledby="trajectory-title">
    <div className={`${styles.container} ${styles.trajectoryGrid}`} data-trajectory>
      <div className={styles.mobileExperience} aria-label="Experiencia corporativa">
        <div className={styles.mobileExperienceHead} data-trajectory-company>
          {field('experienceHeading', <p>{content.experienceHeading}</p>)}
          <span aria-hidden="true" />
        </div>
        <ol className={styles.experiencePath}>
          <li className={styles.pathStep} data-trajectory-metric aria-label="Más de veinte años de experiencia corporativa">
            <span className={styles.pathNode} aria-hidden="true" />
            {metric}
            {field('metricLabelMobile', <p>{content.metricLabelMobile}</p>)}
          </li>
          <li className={styles.pathStep} data-trajectory-company>
            <span className={styles.pathNode} aria-hidden="true" />
            <div className={styles.pathLogos}>{logos(styles.pathAmp)}</div>
            <p>{field('roleLine', <span>{content.roleLine}</span>)}{field('regionLine', <span>{content.regionLine}</span>)}</p>
          </li>
        </ol>
      </div>
      <aside className={styles.trajectoryVisual} aria-label="Trayectoria corporativa">
        <div className={styles.metric} data-trajectory-metric aria-label="Más de veinte años de experiencia corporativa">{field('metricValue', <strong>{content.metricValue}{field('metricSuffix', <span>{content.metricSuffix}</span>)}</strong>)}{field('metricLabel', <p>{metricLead}{metricTail !== undefined && <><br className={styles.metricBreak} /><span>{metricTail}</span></>}</p>)}</div>
        <div className={styles.companyRail} aria-label="Experiencia en compañías internacionales">
          <div className={styles.desktopLogos}>{logos(styles.desktopAmp)}</div>
          {field('regionLineDesktop', <small data-trajectory-company><span className={styles.mobileRegionalLine}>{regionLead}</span>{regionTail !== undefined && <><br className={styles.mobileBreak} /> <span className={styles.mobileRegionalLine}>{regionTail}</span></>}</small>)}
        </div>
      </aside>
      <div className={styles.trajectoryNarrative}>
        <SectionTitle section="sobre-mi" title={content.title} id="trajectory-title" className={styles.trajectoryTitle} />
        <div className={styles.story}>{[1, 2, 3, 4, 5].map((number, index) => <Field key={number} route={ROUTE} section="sobre-mi" path={`paragraph${number}`}><p className={index === 0 ? styles.storyLead : ''} data-trajectory-story>{content[`paragraph${number}`]}</p></Field>)}</div>
      </div>
    </div>
  </section>;
}

function Services() {
  const { content } = useSection(ROUTE, 'servicios');
  const remoteItems = validItems(content.items);
  const fallbackItems = validItems(localContent[ROUTE].servicios.items);
  const items = remoteItems.length >= 3 ? remoteItems : [
    ...remoteItems,
    ...fallbackItems.filter(fallback => !remoteItems.some(item => item._id === fallback._id || item.href === fallback.href)),
  ].slice(0, 3);
  const title = remoteItems.length >= 3 ? content.title : localContent[ROUTE].servicios.title;
  return <section id="servicios" className={`${styles.section} ${styles.services}`} aria-labelledby="services-title">
    <div className={styles.container}>
      <div className={styles.servicesHead}><SectionTitle section="servicios" eyebrow={content.eyebrow} title={title} id="services-title" /></div>
      <Collection route={ROUTE} section="servicios" path="items"><div className={styles.serviceGrid}>{items.map((item, index) => <Collection key={item._id} route={ROUTE} section="servicios" path="items" itemId={item._id}><article className={styles.serviceCard} data-reveal>
        <span className={styles.cardNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><p className={styles.cardEyebrow}>{item.eyebrow}</p>
        <h3><a href={safeHref(item.href)}>{item.title}</a></h3><p className={styles.cardCopy}>{item._id === 'comunidad' && item.description === LEGACY_COMMUNITY_DESCRIPTION ? COMMUNITY_DESCRIPTION : item.description}</p>
        <Field route={ROUTE} section="servicios" path="cardLinkLabel"><a className={styles.cardLink} href={safeHref(item.href)} aria-label={`Conocer ${item.eyebrow || item.title}`}>{content.cardLinkLabel} <span aria-hidden="true">↗</span></a></Field>
      </article></Collection>)}</div></Collection>
      <div className={styles.servicesAction} data-reveal>
        <div className={styles.servicesCloseCopy}>
          <Field route={ROUTE} section="servicios" path="closingTitle"><p className={styles.servicesCloseTitle}>{content.closingTitle}</p></Field>
          <Field route={ROUTE} section="servicios" path="closingText"><p className={styles.servicesCloseText}>{content.closingText}</p></Field>
        </div>
        <CmsLink route={ROUTE} section="servicios" path="cta" value={content.cta} className="editorial-button" /></div>
    </div>
  </section>;
}

const APPROACH_ICONS = [
  <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="18" /><path d="m41 23-6.5 14.5L23 41l6.5-14.5L41 23Z" /><path d="m29.5 26.5 5 11" /></svg>,
  <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="25" cy="25" r="12" /><circle cx="39" cy="25" r="12" /><circle cx="25" cy="39" r="12" /><circle cx="39" cy="39" r="12" /></svg>,
  <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="18" r="8" /><circle cx="18" cy="44" r="8" /><circle cx="46" cy="44" r="8" /><path d="m28 25-6 12m14-12 6 12M26 44h12" /></svg>,
];

function approachTitleLines(title = '') {
  const lines = title.match(/[^.]+\.?/g)?.map(line => line.trim()).filter(Boolean) || [title];
  return lines.length === 3 ? lines : [title];
}

export function resolveApproachSteps(value, fallback = localContent[ROUTE].enfoque.steps) {
  const remoteSteps = validItems(value);
  const fallbackSteps = validItems(fallback);
  if (remoteSteps.length >= 3) return remoteSteps.slice(0, 3);
  const remoteIds = new Set(remoteSteps.map(step => step._id));
  return [...remoteSteps, ...fallbackSteps.filter(step => !remoteIds.has(step._id))].slice(0, 3);
}

function Approach() {
  const { content } = useSection(ROUTE, 'enfoque');
  const paragraphs = ['paragraph1', 'paragraph2', 'paragraph3', 'paragraph4'].filter(key => content[key]);
  const steps = resolveApproachSteps(content.steps);
  const titleLines = approachTitleLines(content.title);
  return <section id="enfoque" className={`${styles.section} ${styles.approach}`} aria-labelledby="approach-title" data-tone="dark">
    <div className={`${styles.approachArcs} ${styles.approachArcsLeft}`} aria-hidden="true" />
    <div className={`${styles.approachArcs} ${styles.approachArcsRight}`} aria-hidden="true" />
    <div className={`${styles.container} ${styles.approachGrid}`}>
      <div className={styles.approachHeading}>
        <Field route={ROUTE} section="enfoque" path="eyebrow"><p className={styles.darkKicker} data-reveal>{content.eyebrow}</p></Field>
        <Field route={ROUTE} section="enfoque" path="title"><h2 id="approach-title" data-reveal>{titleLines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}</h2></Field>
        <Collection route={ROUTE} section="enfoque" path="steps"><ol className={styles.pillars} aria-label="Pilares de Career Longevity" data-reveal>{steps.map((step, index) => <Collection key={step._id} route={ROUTE} section="enfoque" path="steps" itemId={step._id}><li><div className={styles.pillarIcon}>{APPROACH_ICONS[index]}</div><div className={styles.pillarCopy}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></div></li></Collection>)}</ol></Collection>
      </div>
      <div className={styles.approachCopy}>{paragraphs.map(key => <Field key={key} route={ROUTE} section="enfoque" path={key}><p data-reveal>{content[key]}</p></Field>)}</div>
      {content.highlight && <Field route={ROUTE} section="enfoque" path="highlight"><blockquote className={styles.approachQuote} data-reveal>{content.highlight}</blockquote></Field>}
    </div>
  </section>;
}

function Testimonials() {
  const { content } = useSection(ROUTE, 'testimonios');
  const items = validItems(content.items);
  const closingUrl = linkedInUrl(content.closingLink?.href) || LINKEDIN_RECOMMENDATIONS_URL;
  return <section id="testimonios" className={`${styles.section} ${styles.testimonials}`} aria-labelledby="testimonials-title"><div className={styles.container}>
    <div className={styles.testimonialsHead}><SectionTitle section="testimonios" eyebrow={content.eyebrow} title={content.title} id="testimonials-title" /><Field route={ROUTE} section="testimonios" path="paragraph1"><p data-reveal>{content.paragraph1?.split(/(?<=\.)\s+/).map((sentence, index) => <span className={styles.recommendationSentence} key={index}>{index > 0 && ' '}{sentence}</span>)}</p></Field></div>
    <Collection route={ROUTE} section="testimonios" path="items"><div className={styles.testimonialGrid}>{items.map((item, index) => {
      const portrait = safeImage(item.image, TESTIMONIAL_PORTRAITS[item.author] || '');
      const source = linkedInUrl(item.linkedinUrl) || LINKEDIN_RECOMMENDATIONS_URL;
      return <TestimonialCard key={item._id} route={ROUTE} item={item} index={index} portrait={portrait} source={source} reveal />;
    })}</div></Collection>
    <div className={styles.testimonialClosing} data-reveal>
      <div className={styles.closingRule} aria-hidden="true" />
      <div className={styles.closingCopy}>
        <Field route={ROUTE} section="testimonios" path="closingEyebrow"><p className={styles.closingEyebrow}>{content.closingEyebrow}</p></Field>
        <Field route={ROUTE} section="testimonios" path="closingTitle"><h3>{content.closingTitle}</h3></Field>
        <Field route={ROUTE} section="testimonios" path="closingDescription"><p className={styles.closingDescription}>{content.closingDescription}</p></Field>
      </div>
      <Field route={ROUTE} section="testimonios" path="closingLink"><a className={styles.closingLink} href={closingUrl} target="_blank" rel="noopener noreferrer">{content.closingLink?.label || 'Ver todas las recomendaciones ↗'}<span className="sr-only"> (se abre en una pestaña nueva)</span></a></Field>
    </div>
  </div></section>;
}

function Articles() {
  const { content } = useSection(ROUTE, 'articulos');
  return <section id="articulos" className={`${styles.section} ${styles.articles}`} aria-labelledby="articles-title"><div className={styles.container}>
    <div className={styles.articlesIntro}><SectionTitle section="articulos" eyebrow={content.eyebrow} title={content.title} id="articles-title" /><div className={styles.articlesCopy} data-reveal><Field route={ROUTE} section="articulos" path="paragraph1"><p>{content.paragraph1}</p></Field><Field route={ROUTE} section="articulos" path="paragraph2"><p>{content.paragraph2}</p></Field></div></div>
    <div className={styles.articleFeed} data-reveal><ArticleCards limit={3} /></div><div className={styles.articlesAction} data-reveal><CmsLink route={ROUTE} section="articulos" path="cta" value={content.cta} className="editorial-button" /></div>
  </div></section>;
}

function Contact() {
  const { content } = useSection(ROUTE, 'contacto');
  const background = safeImage(content.image, '/assets/claudia-sanchez/claudia-bg-contacto.png');
  return <section id="contacto" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-title">
    <Field route={ROUTE} section="contacto" path="image"><div className={styles.contactBackdrop} aria-hidden="true" style={{ backgroundImage: `url("${background}")` }} /></Field>
    <div className={`${styles.container} ${styles.contactInner}`}>
    <Field route={ROUTE} section="contacto" path="eyebrow"><div className={styles.contactMark} aria-hidden="true"><span>{content.eyebrow}</span></div></Field><div className={styles.contactContent}>
      <Field route={ROUTE} section="contacto" path="title"><h2 id="contact-title" data-reveal>{content.title}</h2></Field><div className={styles.contactCopy} data-reveal><Field route={ROUTE} section="contacto" path="paragraph1"><p>{content.paragraph1}</p></Field><Field route={ROUTE} section="contacto" path="paragraph2"><p>{content.paragraph2}</p></Field></div>
      <div data-reveal><CmsLink route={ROUTE} section="contacto" path="cta" value={content.cta} className="editorial-button" /></div>
    </div>
  </div></section>;
}

export default function HomePage() {
  const root = useRef(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      const q = gsap.utils.selector(root.current);
      const header = document.querySelector('.institutional.is-home .institutional-header');
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(header, { opacity: 0, y: -12, duration: .7 }, .05)
        .from(q('[data-hero-backdrop]'), { opacity: 0, scale: 1.025, duration: 1.35, ease: 'power2.out' }, .05)
        .from(q('[data-hero-item]'), { opacity: 0, y: 22, duration: .85, stagger: .12 }, .28);
      q('[data-reveal]').forEach(element => gsap.from(element, { opacity: 0, y: 26, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } }));
      q('[data-trajectory]').forEach(section => {
        const timeline = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 78%', once: true }, defaults: { ease: 'power3.out' } });
        timeline
          .from(section.querySelectorAll('[data-trajectory-metric]'), { opacity: 0, y: 34, duration: 1 })
          .from(section.querySelectorAll('[data-trajectory-company]'), { opacity: 0, y: 15, duration: .62, stagger: .1 }, '-=.58')
          .from(section.querySelectorAll('[data-trajectory-story]'), { opacity: 0, y: 18, duration: .72, stagger: .09 }, '-=.46');
      });
      // El hero puede estar oculto en Eze CMS: sin él no hay parallax.
      const hero = q('[data-home-hero]')[0];
      if (hero) gsap.to(q('[data-hero-backdrop]'), { backgroundPositionY: '52%', ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .5 } });
    });
    return () => mm.revert();
  }, { scope: root });
  const block = (section, node) => <SectionBlock route={ROUTE} section={section}>{node}</SectionBlock>;
  return <div className={styles.home} ref={root}><Seo route={ROUTE} />{block('hero', <Hero />)}{block('sobre-mi', <Trajectory />)}{block('servicios', <Services />)}{block('enfoque', <Approach />)}{block('testimonios', <Testimonials />)}{block('articulos', <Articles />)}{block('contacto', <Contact />)}</div>;
}
