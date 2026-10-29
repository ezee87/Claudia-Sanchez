import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSection } from './Cms';
import { safeImage } from './content';
import { articleMediaUrl } from '../../integration/eze-cms/cmsRuntime';
import { articleCoverAlt, articleDescription, articleJsonLd, articleTitle } from '../../integration/eze-cms/articleShared.js';
import { NOINDEX, resolveCanonical, resolvePageSeo, resolveRobots } from '../../integration/eze-cms/seoShared.js';
import { seoIndexing, seoOrigin, usePageSeo } from '../../integration/eze-cms/pageSeo.js';

const ARTICLE_ROUTE = '/articulos/:slug';

export default function Seo({route,article,missing=false}) {
  const {content,hidden}=useSection(route,'seo');
  // El SEO genérico de /articulos/:slug nunca se lee: cada artículo usa el suyo.
  const pageSeo=usePageSeo(route===ARTICLE_ROUTE ? null : route);
  const {pathname}=useLocation();
  useEffect(()=>{
    const indexing=seoIndexing();
    // Artículo: api/articulo.js ya escribió en el HTML las etiquetas de esta URL (data-ssr-seo), generadas en la misma
    // petición; se conservan hasta navegar a otra y solo se endurece robots si el host no es el definitivo. Páginas: las
    // del build se reemplazan siempre, porque editar el SEO de una página no vuelve a compilar el sitio y pageSeo puede
    // ser más reciente.
    const ssr=[...document.head.querySelectorAll('[data-ssr-seo]')];
    if(route===ARTICLE_ROUTE && ssr.length && ssr.every(el=>el.getAttribute('data-ssr-seo')===pathname)){
      if(!indexing) ssr.filter(el=>el.getAttribute('name')==='robots').forEach(el=>el.setAttribute('content',NOINDEX));
      return;
    }
    ssr.forEach(el=>el.remove());
    // Mientras el artículo carga no se aplica nada: los metadatos genéricos de la ruta no reemplazan a los del artículo.
    if(route===ARTICLE_ROUTE && !article && !missing) return;
    const created=[];
    const page=article ? null : resolvePageSeo({pageSeo,section:content,hidden});
    const title=article ? articleTitle(article) : page.title;
    const description=article ? articleDescription(article) : page.description;
    if(title!==undefined)document.title=title;
    function meta(key,value,property=false) {
      if(!value)return;
      const el=document.createElement('meta');el.setAttribute(property?'property':'name',key);el.content=value;document.head.append(el);created.push(el);
    }
    document.head.querySelectorAll('meta[name="robots"]').forEach(el=>el.remove());
    // El bloqueo global se mantiene salvo autorización en el dominio definitivo; el noindex del CMS solo restringe.
    meta('robots',resolveRobots({indexing:indexing && !missing,noindex:article ? article.noindex : page.noindex,route}));
    meta('description',description);meta('og:title',title,true);meta('og:description',description,true);meta('og:type',article?'article':'website',true);meta('twitter:card',article?.cover_image?'summary_large_image':'summary');meta('twitter:title',title);meta('twitter:description',description);
    const canonical=missing ? '' : resolveCanonical({cmsCanonical:article ? article.canonical_url : page.canonical,origin:seoOrigin,path:pathname});
    if(canonical){const el=document.createElement('link');el.rel='canonical';el.href=canonical;document.head.append(el);created.push(el);meta('og:url',canonical,true);}
    const cover=safeImage(articleMediaUrl(article?.cover_image));
    const image=cover && (canonical || cover.startsWith('http')) ? new URL(cover,canonical || undefined).href : '';
    if(image){meta('og:image',image,true);meta('og:image:alt',articleCoverAlt(article),true);meta('twitter:image',image);meta('twitter:image:alt',articleCoverAlt(article));}
    if(article){const el=document.createElement('script');el.type='application/ld+json';el.textContent=JSON.stringify(articleJsonLd(article,{canonical,image,description}));document.head.append(el);created.push(el);}
    return ()=>created.forEach(el=>el.remove());
  },[content,hidden,pageSeo,pathname,route,article,missing]);
  return null;
}
