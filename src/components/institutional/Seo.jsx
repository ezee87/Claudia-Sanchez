import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSection } from './Cms';
import { safeImage } from './content';
import { articleMediaUrl } from '../../integration/eze-cms/cmsRuntime';

function plainText(node) {
  if (!node || typeof node !== 'object') return '';
  return [typeof node.text === 'string' ? node.text : '', ...(Array.isArray(node.content) ? node.content.map(plainText) : [])].join(' ');
}
export default function Seo({route,article,missing=false}) {
  const {content}=useSection(route,'seo');
  const {pathname}=useLocation();
  useEffect(()=>{
    const created=[];
    const title=article ? `${article.title} | Claudia Sánchez Urencio` : content.title;
    const description=article ? (article.excerpt || plainText(article.content)).replace(/\s+/g,' ').trim().slice(0,160) : content.description;
    document.title=title;
    function meta(key,value,property=false) {
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
    if(cover && (canonical || cover.startsWith('http'))){const url=new URL(cover,canonical).href;meta('og:image',url,true);meta('twitter:image',url);}
    if(article){const el=document.createElement('script');el.type='application/ld+json';el.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:article.title,datePublished:article.original_published_at || article.published_at,author:{'@type':'Person',name:'Claudia Sánchez Urencio'},...(canonical?{mainEntityOfPage:canonical}:{}),...(cover && canonical?{image:new URL(cover,canonical).href}:{})});document.head.append(el);created.push(el);}
    return ()=>created.forEach(el=>el.remove());
  },[content,pathname,article,missing]);
  return null;
}
