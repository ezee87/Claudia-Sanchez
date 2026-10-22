import { CmsLink, Collection, Field, useSection } from './Cms';
import { content, safeHref, safeImage, validItems } from './content';
import { ArticleCards } from './articles';

export default function Section({route,section,hero=false}) {
  const {content:c}=useSection(route,section);
  const field=(path,child)=><Field route={route} section={section} path={path}>{child}</Field>;
  const dark=section==='contacto'||section==='enfoque'||(hero&&route==='/empresas');
  const Heading=hero?'h1':'h2';
  const image=safeImage(c.image, route==='/' && section==='hero'?'/assets/claudia-sanchez/claudia-hero.png':'');
  return <section id={section} className={`editorial-section section-${section} ${hero?'editorial-hero':''} ${image?'has-portrait':''}`} data-tone={dark?'dark':undefined}>
    <div className="site-container section-inner">
      <div className="section-heading">{c.eyebrow&&field('eyebrow',<p className="eyebrow">{c.eyebrow}</p>)}{c.title&&field('title',<Heading>{c.title}</Heading>)}{c.subtitle&&field('subtitle',<p className="section-subtitle">{c.subtitle}</p>)}</div>
      <div className="section-copy">{Object.keys(content[route][section]).filter(k=>k.startsWith('paragraph')).map(k=><Field key={k} route={route} section={section} path={k}><p>{c[k]}</p></Field>)}{c.highlight&&field('highlight',<p className="highlight">{c.highlight}</p>)}{c.signature&&field('signature',<p>{c.signature}</p>)}</div>
      {image&&field('image',<img className="editorial-portrait" src={image} alt={c.alt} width="1198" height="1313" onError={e=>{e.currentTarget.onerror=null;if(!e.currentTarget.src.endsWith('/assets/claudia-sanchez/claudia-hero.png'))e.currentTarget.src='/assets/claudia-sanchez/claudia-hero.png';}} fetchPriority={hero?'high':'auto'} loading={hero?'eager':'lazy'}/>)}
      {Array.isArray(c.items)&&<Collection route={route} section={section} path="items"><div className={`editorial-items ${section==='testimonios'?'quote-grid':''}`}>
        {validItems(c.items).map((item,i)=><Collection key={item._id} route={route} section={section} path="items" itemId={item._id}>{item.quote?<figure className="quote-card">{safeImage(item.image)&&<img src={safeImage(item.image)} alt={item.alt||''} width="64" height="64" loading="lazy"/>}<blockquote>“{item.quote}”</blockquote><figcaption><strong>{item.author}</strong>{item.role&&<span>{item.role}</span>}</figcaption></figure>:<article className="editorial-card"><span className="item-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>{item.eyebrow&&<p className="eyebrow">{item.eyebrow}</p>}<h3>{item.href&&!item.label?<a href={safeHref(item.href)}>{item.title}</a>:item.title}</h3>{item.subtitle&&<p className="card-subtitle">{item.subtitle}</p>}{item.description?.split('\n\n').map((p,n)=><p key={n}>{p}</p>)}{item.label&&<a className="editorial-button" href={safeHref(item.href,`/contacto?tipo=${route==='/empresas'?'empresa':'persona'}`)}>{item.label}<span aria-hidden="true">↗</span></a>}</article>}</Collection>)}
      </div></Collection>}
      {Array.isArray(c.credentials)&&<Collection route={route} section={section} path="credentials"><ul className="credentials">{validItems(c.credentials).filter(x=>x.status==='confirmed').map(item=><Collection key={item._id} route={route} section={section} path="credentials" itemId={item._id}><li>{item.title}</li></Collection>)}</ul></Collection>}
      {section==='articulos'&&<ArticleCards limit={3}/>}
      {c.cta&&<div className="section-action"><CmsLink route={route} section={section} path="cta" value={c.cta} className="editorial-button"/></div>}
    </div>
  </section>;
}
