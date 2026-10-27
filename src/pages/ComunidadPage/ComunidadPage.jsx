import Seo from '../../components/institutional/Seo';
import { CmsLink, Collection, Field, useSection } from '../../components/institutional/Cms';
import { content as localContent, safeHref, safeImage, validItems } from '../../components/institutional/content';
import { whatsappLinkProps } from '../../data/institutional/whatsapp';
import styles from '../HomePage/HomePage.module.css';
import './ComunidadPage.css';

const route = '/comunidad-y-experiencias';
const field = (section, path, child) => <Field route={route} section={section} path={path}>{child}</Field>;

// "a, b, c y d" -> ['a', 'b', 'c', 'd'], keeping the original wording of each entry.
function splitList(text) {
  const parts = text.replace(/\.$/, '').split(/,\s*/);
  const last = parts.pop().split(/\s+y\s+(?=[^,]*$)/);
  return [...parts, ...last].filter(Boolean);
}

// Groups the CMS description into lead, modalities, topics and closing notes without changing its text.
// Anything that doesn't match these shapes falls back to plain paragraphs.
function groupDescription(description = '') {
  const groups = { lead: '', modalities: [], topics: [], notes: [] };
  for (const paragraph of description.split('\n\n').map(p => p.trim()).filter(Boolean)) {
    const topicLines = paragraph.match(/^Qué trabaja:\n([\s\S]+)$/);
    if (topicLines) { groups.topics = topicLines[1].split('\n').map(t => t.trim()).filter(Boolean); continue; }
    const modality = paragraph.match(/^([^:.]{2,40}):\s*(.+)$/);
    const topics = paragraph.match(/^(.+?\.)\s+Trabaja\s+(.+)$/);
    if (modality) groups.modalities.push({ name: modality[1], items: splitList(modality[2]) });
    else if (topics && !groups.lead) { groups.lead = topics[1]; groups.topics = splitList(topics[2]); }
    else if (!groups.lead) groups.lead = paragraph;
    else groups.notes.push(paragraph);
  }
  return groups;
}

function Hero() {
  const { content: c } = useSection(route, 'hero');
  // "Perspectiva, conversación" / "y espacio para decidir lo que sigue."
  const titleParts = c.title?.match(/^(.+?,\s*\S+?)\s+(y\s.+)$/);
  // Keep "lo que sigue." together so narrow screens break after "decidir" without a hard line break.
  const tailParts = titleParts?.[2].match(/^(.+?)\s+(lo que sigue\.)$/);
  return <section id="hero" className="editorial-section editorial-hero community-hero">
    <div className="site-container community-hero-inner">
      {field('hero', 'eyebrow', <p className="eyebrow community-eyebrow">{c.eyebrow}</p>)}
      {field('hero', 'title', <h1>{titleParts ? <><span className="community-title-lead">{titleParts[1]}</span>{' '}<span className="community-title-rest">{tailParts ? <>{tailParts[1]} <span className="community-title-tail">{tailParts[2]}</span></> : titleParts[2]}</span></> : c.title}</h1>)}
      <div className="community-hero-detail">
        <div className="section-copy">
          {field('hero', 'paragraph1', <p>{c.paragraph1}</p>)}
          {field('hero', 'paragraph2', <p>{c.paragraph2}</p>)}
        </div>
        <div className="community-hero-action"><CmsLink route={route} section="hero" path="cta" value={c.cta} className="editorial-button"/></div>
      </div>
    </div>
  </section>;
}

function Experience({ item, index }) {
  const { lead, modalities, topics, notes } = groupDescription(item.description);
  return <Collection route={route} section="experiencias" path="items" itemId={item._id}>
    <article className="community-experience" aria-labelledby={`experience-${item._id}`}>
      <header className="community-experience-visual">
        <span className="community-experience-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <div className="community-experience-name">
          <h3 id={`experience-${item._id}`}>{item.title}</h3>
          {item.subtitle && <p className="community-experience-subtitle">{item.subtitle}</p>}
        </div>
      </header>
      <div className="community-experience-body">
        {lead && <p className="community-experience-lead">{lead}</p>}
        {modalities.length > 0 && <div className="community-experience-group">
          <h4>Modalidades</h4>
          <div className="community-modalities">{modalities.map(m => <div key={m.name} className="community-modality">
            <h5>{m.name}</h5>
            <ul>{m.items.map(text => <li key={text}>{text}</li>)}</ul>
          </div>)}</div>
        </div>}
        {topics.length > 0 && <div className="community-experience-group">
          <h4>Qué trabaja</h4>
          <ul className="community-topics">{topics.map(text => <li key={text}>{text}</li>)}</ul>
        </div>}
        {notes.map((text, n) => <p key={n} className="community-experience-note">{text}</p>)}
        {item.label && <a className="editorial-button" href={safeHref(item.href, '/contacto')} {...whatsappLinkProps(item.href)}>{item.label}<span aria-hidden="true">↗</span></a>}
      </div>
    </article>
  </Collection>;
}

function Experiences() {
  const { content: c } = useSection(route, 'experiencias');
  return <section id="experiencias" className="editorial-section community-experiences" aria-labelledby="community-experiences-title">
    <div className="site-container">
      <header className="community-experiences-heading">
        <p className="eyebrow community-eyebrow">LAS EXPERIENCIAS</p>
        {field('experiencias', 'title', <h2 id="community-experiences-title">{c.title}</h2>)}
      </header>
      <Collection route={route} section="experiencias" path="items"><div className="community-experience-list">
        {validItems(c.items).map((item, index) => <Experience key={item._id} item={item} index={index}/>)}
      </div></Collection>
    </div>
  </section>;
}

function Contact() {
  const { content: c } = useSection(route, 'contacto');
  const { content: homeContact } = useSection('/', 'contacto');
  const background = safeImage(homeContact.image, localContent['/'].contacto.image);
  return <section id="contacto" className={`${styles.section} ${styles.contact} community-contact`} aria-labelledby="community-contact-title">
    <div className={styles.contactBackdrop} aria-hidden="true" style={{ backgroundImage: `url("${background}")` }}/>
    <div className="site-container community-contact-inner">
      {field('contacto', 'title', <h2 id="community-contact-title">{c.title}</h2>)}
      {field('contacto', 'paragraph1', <p className="community-contact-copy">{c.paragraph1}</p>)}
      <div><CmsLink route={route} section="contacto" path="cta" value={c.cta} className="editorial-button"/></div>
    </div>
  </section>;
}

export default function ComunidadPage() {
  return <div className="community-page">
    <Seo route={route}/>
    <Hero/>
    <Experiences/>
    <Contact/>
  </div>;
}
