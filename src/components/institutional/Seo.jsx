import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSection } from './Cms';
import { safeImage } from './content';
import { articleMediaUrl } from '../../integration/eze-cms/cmsRuntime';
import { articleDescription, articleJsonLd, articleTitle } from '../../integration/eze-cms/articleShared.js';

export default function Seo({route,article,missing=false}) {
  const {content,hidden}=useSection(route,'seo');
  const {pathname}=useLocation();
  useEffect(()=>{
    // api/articulo.js ya escribió en el HTML las etiquetas de esta URL (data-ssr-seo): se conservan hasta que se navega a otra.
    const ssr=[...document.head.querySelectorAll('[data-ssr-seo]')];
    if(ssr.length && ssr.every(el=>el.getAttribute('data-ssr-seo')===pathname)) return;
    ssr.forEach(el=>el.remove());
    const created=[];
    // Con la sección seo oculta en Eze CMS no se aplica su título ni su descripción (tampoco los locales).
    const title=article ? articleTitle(article) : hidden ? undefined : content.title;
    const description=article ? articleDescription(article) : hidden ? undefined : content.description;
    if(title!==undefined)document.title=title;
    function meta(key,value,property=false) {
      if(value===undefined)return;
      const el=document.createElement('meta');el.setAttribute(property?'property':'name',key);el.content=value;document.head.append(el);created.push(el);
    }
    document.head.querySelectorAll('meta[name="robots"]').forEach(el=>el.remove());
    // Editorial approval is still pending: retain the repository's private indexing policy.
    meta('robots','noindex, nofollow, noarchive');
    meta('description',description);meta('og:title',title,true);meta('og:description',description,true);meta('og:type',article?'article':'website',true);meta('twitter:card',article?.cover_image?'summary_large_image':'summary');meta('twitter:title',title);meta('twitter:description',description);
    let canonical;
    try { const base=new URL(import.meta.env.VITE_SITE_URL); if(['http:','https:'].includes(base.protocol)) canonical=new URL(pathname,base.origin).href; } catch { /* no invented production domain */ }
    if(canonical && !missing){const el=document.createElement('link');el.rel='canonical';el.href=canonical;document.head.append(el);created.push(el);meta('og:url',canonical,true);}
    const cover=safeImage(articleMediaUrl(article?.cover_image));
    const image=cover && (canonical || cover.startsWith('http')) ? new URL(cover,canonical).href : '';
    if(image){meta('og:image',image,true);meta('twitter:image',image);}
    if(article){const el=document.createElement('script');el.type='application/ld+json';el.textContent=JSON.stringify(articleJsonLd(article,{canonical,image,description}));document.head.append(el);created.push(el);}
    return ()=>created.forEach(el=>el.remove());
  },[content,hidden,pathname,article,missing]);
  return null;
}
