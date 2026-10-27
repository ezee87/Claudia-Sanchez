import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Field, useSection } from './Cms';
import { safeHref } from './content';
import { WHATSAPP_URLS } from '../../data/institutional/whatsapp';

const TYPES = [['persona', 'personLabel'], ['empresa', 'companyLabel'], ['otro', 'otherLabel']];

function Arrow() {
  return <svg className="cc-arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
const icons = {
  mail: <path d="M3 6.5h18v11H3zM3.5 7l8.5 6.5L20.5 7" />,
  whatsapp: <path d="M4 20l1.2-4.2A8 8 0 1 1 8.3 18.9zM9 9c0 3 3 6 6 6l1-1.5-2-1-1 .7c-.8-.4-1.6-1.2-2-2l.7-1-1-2z" />,
  linkedin: <path d="M5 9.5v9M5 5.5v.1M10 18.5v-9M10 13c0-2 1.3-3.5 3.2-3.5S16 11 16 13v5.5" />,
};
function Icon({ name }) {
  return <svg className="cc-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>;
}

// Inject a verified transport only after backend integration is supplied.
export default function ContactForm({ sendInquiry }) {
  const { content: c } = useSection('/contacto', 'formulario');
  const { content: direct } = useSection('/contacto', 'contacto-directo');
  const [query] = useSearchParams();
  const queryType = query.get('tipo');
  const [type, setType] = useState(queryType === 'empresa' ? 'empresa' : 'persona');
  const [status, setStatus] = useState('idle');
  const busy = useRef(false);
  useEffect(() => setType(queryType === 'empresa' ? 'empresa' : 'persona'), [queryType]);
  const field = (path, child) => <Field route="/contacto" section="formulario" path={path}>{child}</Field>;

  async function submit(e) {
    e.preventDefault();
    if (busy.current) return;
    // Sin transporte verificado no se envía ni se simula: los datos permanecen en el formulario.
    if (!sendInquiry) { setStatus('unavailable'); return; }
    busy.current = true;
    setStatus('loading');
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const result = await sendInquiry({ ...values, service: (query.get('servicio') || '').slice(0, 120) });
      if (result?.ok !== true) throw new Error('Submission failed');
      setStatus('success');
      form.reset();
    } catch { setStatus('error'); } finally { busy.current = false; }
  }

  const emailHref = safeHref(direct.email?.href, '');
  const showEmail = direct.email?.label && emailHref.startsWith('mailto:');
  const whatsappHref = WHATSAPP_URLS.contacto;
  const linkedinHref = safeHref(direct.linkedin?.href, '');

  const ext = { target: '_blank', rel: 'noopener noreferrer' };
  const channelBody = (icon, label, sub) => <><Icon name={icon}/><span className="cc-text"><span className="cc-name">{label}</span>{sub&&<span className="cc-sub">{sub}</span>}</span><Arrow/></>;

  return <section className="contact-section"><div className="site-container">
    <div className="contact-card">
      <form className="contact-form" onSubmit={submit} aria-busy={status === 'loading'}>
        <div className="form-pair">
          <div className="cf-field">{field('nameLabel', <label htmlFor="contact-name">{c.nameLabel}</label>)}{field('namePlaceholder', <input id="contact-name" name="name" autoComplete="name" placeholder={c.namePlaceholder} required maxLength={150}/>)}</div>
          <div className="cf-field">{field('emailLabel', <label htmlFor="contact-email">{c.emailLabel}</label>)}{field('emailPlaceholder', <input id="contact-email" name="email" type="email" autoComplete="email" placeholder={c.emailPlaceholder} required maxLength={254}/>)}</div>
        </div>
        <fieldset className="cf-types">
          {field('typeLabel', <legend>{c.typeLabel}</legend>)}
          <div className="cf-options">
            {TYPES.map(([value, key]) => <label className="cf-option" key={value}><input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} required/>{field(key, <span>{c[key]}</span>)}</label>)}
          </div>
        </fieldset>
        {type === 'empresa' && <div className="cf-field">{field('companyFieldLabel', <label htmlFor="contact-company">{c.companyFieldLabel}</label>)}{field('companyPlaceholder', <input id="contact-company" name="company" autoComplete="organization" placeholder={c.companyPlaceholder} maxLength={200}/>)}</div>}
        <div className="cf-field">{field('messageLabel', <label htmlFor="contact-message">{c.messageLabel}</label>)}{field('messagePlaceholder', <textarea id="contact-message" name="message" placeholder={c.messagePlaceholder} required rows={5} maxLength={5000}/>)}</div>
        {field('submitLabel', <button type="submit" className="cf-submit" disabled={status === 'loading'}><span>{status === 'loading' ? c.loading : c.submitLabel}</span><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>)}
        <div id="contact-status" role={status === 'error' ? 'alert' : 'status'} aria-live="polite">
          {status === 'unavailable' && <p className="cf-unavailable">El envío todavía no está disponible. Tus datos se conservan; mientras tanto puedes escribirme por correo electrónico o LinkedIn.</p>}
          {status === 'error' && field('error', <p className="cf-error">{c.error}</p>)}
          {status === 'success' && <>{field('successTitle', <h2>{c.successTitle}</h2>)}{field('successText', <p>{c.successText}</p>)}</>}
        </div>
      </form>
      <aside className="contact-alt" aria-labelledby="contact-alt-title">
        <Field route="/contacto" section="contacto-directo" path="title"><h2 id="contact-alt-title">{direct.title}</h2></Field>
        <Field route="/contacto" section="contacto-directo" path="paragraph1"><p className="contact-alt-intro">{direct.paragraph1}</p></Field>
        <ul className="contact-channels">
          {showEmail && <li><a className="contact-channel" href={emailHref}>{channelBody('mail', 'Correo electrónico', direct.email.label)}</a></li>}
          <li>{whatsappHref
            ? <a className="contact-channel" href={whatsappHref} {...ext}>{channelBody('whatsapp', 'Escribirme por WhatsApp')}</a>
            : <button type="button" className="contact-channel" onClick={() => {}}>{channelBody('whatsapp', 'Escribirme por WhatsApp')}</button>}</li>
          {linkedinHref && <li><a className="contact-channel" href={linkedinHref} {...ext}>{channelBody('linkedin', 'LinkedIn')}<span className="sr-only"> (se abre en una pestaña nueva)</span></a></li>}
        </ul>
      </aside>
    </div>
  </div></section>;
}
