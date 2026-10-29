import Section from '../../components/institutional/Section';
import Seo from '../../components/institutional/Seo';
import TestimonialCard, { LINKEDIN_RECOMMENDATIONS_URL, linkedInUrl } from '../../components/institutional/TestimonialCard';
import { Collection, Field, SectionBlock, useSection } from '../../components/institutional/Cms';
import { content, safeHref, safeImage, validItems } from '../../components/institutional/content';
import { bindArticles, resolveBusinessTestimonials, splitServiceDescription } from './content';
import { whatsappLinkProps } from '../../data/institutional/whatsapp';
import styles from '../HomePage/HomePage.module.css';
import './EmpresasPage.css';

const route = '/empresas';
// Compatibilidad: si el contenido del CMS todavía no trae `tag`, `initials`, `note` o `lang`, se usa la regla anterior por id o autor.
const serviceTags = { 'equipos-culturas': 'EQUIPOS', 'executive-longevity': 'TRANSICIONES' };
const legacyInitials = item => item.author === 'Ricardo Schmidt' ? 'RS' : undefined;
const legacyNote = item => item.author === 'Ana Cristina del Ángel Nájera' ? 'Extracto de recomendación' : undefined;
const legacyLang = item => item.author === 'Pedro Fondevila' ? 'en' : 'es';
const field = (section, path, child) => <Field route={route} section={section} path={path}>{child}</Field>;

function Services() {
  const { content: c } = useSection(route, 'servicios');
  return <section id="servicios" className="editorial-section section-servicios business-services" aria-labelledby="business-services-title">
    <div className="site-container">
      {field('servicios', 'eyebrow', <p className="eyebrow">{c.eyebrow}</p>)}
      {field('servicios', 'title', <h2 id="business-services-title">{c.title}</h2>)}
      <Collection route={route} section="servicios" path="items"><div className="business-services-grid">
        {validItems(c.items).map((item, index) => {
          const { audience, included } = splitServiceDescription(item.description);
          const tag = item.tag ?? serviceTags[item._id];
          return <Collection key={item._id} route={route} section="servicios" path="items" itemId={item._id}>
            <article className="business-service">
              <span className="item-number">{String(index + 1).padStart(2, '0')}{tag && ` / ${tag}`}</span>
              <h3>{item.title}</h3>
              {item.subtitle && <p className="business-service-statement">{bindArticles(item.subtitle)}</p>}
              <div className="business-service-audience">{audience.map((p, i) => <p key={i}>{p}</p>)}</div>
              {included.length > 0 && <div className="business-service-method">
                {field('servicios', 'includedHeading', <h4>{c.includedHeading}</h4>)}
                <ul>{included.map((text, i) => <li key={i}>{text}</li>)}</ul>
              </div>}
              {item.label && <a className="editorial-button" href={safeHref(item.href, '/contacto?tipo=empresa')} {...whatsappLinkProps(item.href)}>{item.label}<span aria-hidden="true">↗</span></a>}
            </article>
          </Collection>;
        })}
      </div></Collection>
    </div>
  </section>;
}

function Testimonials() {
  const { content: remote } = useSection(route, 'testimonios');
  const c = resolveBusinessTestimonials(remote, content[route].testimonios);
  const portraits = Object.fromEntries(content[route].testimonios.items.map(item => [item.author, item.image]));
  return <section id="testimonios" className="editorial-section business-testimonials" aria-labelledby="business-testimonials-title">
    <div className="site-container">
      <div className={styles.testimonialsHead}>
        <header className={styles.sectionTitle}>
          {field('testimonios', 'eyebrow', <p className={styles.kicker}>{c.eyebrow}</p>)}
          {field('testimonios', 'title', <h2 id="business-testimonials-title">{c.title}</h2>)}
        </header>
        {field('testimonios', 'paragraph1', <p>{c.paragraph1}</p>)}
      </div>
      <Collection route={route} section="testimonios" path="items"><div className={`${styles.testimonialGrid} business-testimonial-grid`}>
        {validItems(c.items).map((item, index) => {
          const initials = item.initials ?? legacyInitials(item);
          return <TestimonialCard key={item._id} route={route} item={item} index={index}
            portrait={initials ? '' : safeImage(item.image, portraits[item.author] || '')}
            initials={initials || undefined}
            note={item.note ?? legacyNote(item)}
            source={linkedInUrl(item.linkedinUrl) || LINKEDIN_RECOMMENDATIONS_URL} quoteLang={item.lang ?? legacyLang(item)} className="business-testimonial-card" />;
        })}
      </div></Collection>
    </div>
  </section>;
}

export default function EmpresasPage() {
  return <div className="business-page">
    <Seo route={route}/>
    <Section route={route} section="hero" hero/>
    <Section route={route} section="desafios"/>
    <SectionBlock route={route} section="servicios"><Services/></SectionBlock>
    <Section route={route} section="experiencia"/>
    <Section route={route} section="proceso"/>
    <SectionBlock route={route} section="testimonios"><Testimonials/></SectionBlock>
    <Section route={route} section="contacto"/>
  </div>;
}
