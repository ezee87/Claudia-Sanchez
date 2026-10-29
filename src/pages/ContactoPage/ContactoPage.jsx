import Seo from '../../components/institutional/Seo';
import ContactForm from '../../components/institutional/ContactForm';
import { Field, useSection } from '../../components/institutional/Cms';
import './ContactoPage.css';

// Cada oración empieza en una línea nueva dentro del mismo párrafo (white-space: pre-line).
const breakSentences = text => text.replace(/([.!?])\s+/g, '$1\n');
const field = (path, child) => <Field route="/contacto" section="intro" path={path}>{child}</Field>;

function Hero() {
  const { content: c } = useSection('/contacto', 'intro');
  return <section id="intro" className="contact-hero">
    <div className="contact-hero-lines" aria-hidden="true"/>
    <div className="site-container contact-hero-inner">
      {field('eyebrow', <p className="eyebrow">{c.eyebrow}</p>)}
      {field('title', <h1>{c.title}</h1>)}
      {field('paragraph1', <p className="contact-hero-lead">{breakSentences(c.paragraph1)}</p>)}
      {c.paragraph2 && field('paragraph2', <p className="contact-hero-note">{breakSentences(c.paragraph2)}</p>)}
    </div>
  </section>;
}

export default function ContactoPage() {
  return <><Seo route="/contacto"/><Hero/><ContactForm/></>;
}
