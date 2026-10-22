import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CmsLink, Field, useSection } from './Cms';
import { safeHref } from './content';

// Inject a verified transport only after backend integration is supplied.
export default function ContactForm({sendInquiry}) {
  const {content:c}=useSection('/contacto','formulario');
  const {content:direct}=useSection('/contacto','contacto-directo');
  const [query]=useSearchParams();const queryType=query.get('tipo');
  const [type,setType]=useState(queryType==='empresa'?'empresa':'persona');
  const [status,setStatus]=useState('idle');const busy=useRef(false);
  useEffect(()=>setType(queryType==='empresa'?'empresa':'persona'),[queryType]);
  const field=(path,child)=><Field route="/contacto" section="formulario" path={path}>{child}</Field>;
  async function submit(e){
    e.preventDefault();if(busy.current)return;
    if(!sendInquiry){setStatus('pending');return;}
    busy.current=true;setStatus('loading');
    const form=e.currentTarget;const values=Object.fromEntries(new FormData(form));
    try{const result=await sendInquiry({...values,service:(query.get('servicio')||'').slice(0,120)});if(result?.ok!==true)throw new Error('Submission failed');setStatus('success');form.reset();}catch{setStatus('error');}finally{busy.current=false;}
  }
  return <section className="editorial-section"><div className="site-container contact-layout"><form onSubmit={submit} aria-describedby={!sendInquiry?'contact-status':undefined}>
    <div className="form-pair"><div>{field('nameLabel',<label htmlFor="contact-name">{c.nameLabel}</label>)}{field('namePlaceholder',<input id="contact-name" name="name" autoComplete="name" placeholder={c.namePlaceholder} required maxLength={150}/>)}</div><div>{field('emailLabel',<label htmlFor="contact-email">{c.emailLabel}</label>)}{field('emailPlaceholder',<input id="contact-email" name="email" type="email" autoComplete="email" placeholder={c.emailPlaceholder} required maxLength={254}/>)}</div></div>
    <fieldset>{field('typeLabel',<legend>{c.typeLabel}</legend>)}{[['persona','personLabel'],['empresa','companyLabel'],['otro','otherLabel']].map(([value,key])=><label className="radio-label" key={value}><input type="radio" name="type" value={value} checked={type===value} onChange={()=>setType(value)} required/>{field(key,<span>{c[key]}</span>)}</label>)}</fieldset>
    {type==='empresa'&&<div>{field('companyFieldLabel',<label htmlFor="contact-company">{c.companyFieldLabel}</label>)}{field('companyPlaceholder',<input id="contact-company" name="company" autoComplete="organization" placeholder={c.companyPlaceholder} maxLength={200}/>)}</div>}
    <div>{field('messageLabel',<label htmlFor="contact-message">{c.messageLabel}</label>)}{field('messagePlaceholder',<textarea id="contact-message" name="message" placeholder={c.messagePlaceholder} required rows={6} maxLength={5000}/>)}</div>
    {field('submitLabel',<button type="submit" className="editorial-button" disabled={status==='loading'}>{status==='loading'?c.loading:c.submitLabel}</button>)}
    <div id="contact-status" role={status==='error'?'alert':'status'} aria-live="polite">{!sendInquiry&&field('pending',<p>{c.pending}</p>)}{status==='error'&&field('error',<p>{c.error}</p>)}{status==='success'&&<>{field('successTitle',<h2>{c.successTitle}</h2>)}{field('successText',<p>{c.successText}</p>)}</>}</div>
  </form><aside><Field route="/contacto" section="contacto-directo" path="title"><h2>{direct.title}</h2></Field>{direct.email?.label&&safeHref(direct.email.href,'').startsWith('mailto:')&&<><Field route="/contacto" section="contacto-directo" path="paragraph1"><p>{direct.paragraph1}</p></Field><CmsLink route="/contacto" section="contacto-directo" path="email" value={direct.email}/></>}{direct.whatsapp?.label&&<CmsLink route="/contacto" section="contacto-directo" path="whatsapp" value={direct.whatsapp}/>}<CmsLink route="/contacto" section="contacto-directo" path="linkedin" value={direct.linkedin}/></aside></div></section>;
}
