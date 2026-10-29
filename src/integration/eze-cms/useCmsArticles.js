import { useEffect, useState } from 'react';
import { cmsRuntimeConfig, readCmsArticles } from './cmsRuntime';

let allArticlesRequest;

function requestArticles(articleSlug) {
  if (articleSlug) return readCmsArticles({ siteSlug: cmsRuntimeConfig.siteSlug, articleSlug });
  allArticlesRequest ??= readCmsArticles({ siteSlug: cmsRuntimeConfig.siteSlug });
  return allArticlesRequest;
}

// Artículo que api/articulo.js ya incluyó en el HTML: el primer render lo muestra sin estado de carga ni nueva consulta.
const seededArticle = (() => {
  if (typeof document === 'undefined') return null;
  try {
    const article = JSON.parse(document.getElementById('ssr-article')?.textContent || 'null');
    return article && typeof article.slug === 'string' ? article : null;
  } catch {
    return null;
  }
})();

const seededState = articleSlug => articleSlug && seededArticle?.slug === articleSlug
  ? { articles: [seededArticle], loading: false, error: null }
  : null;

export function useCmsArticles(articleSlug) {
  const [state, setState] = useState(() => seededState(articleSlug) ?? { articles: [], loading: true, error: null });
  useEffect(() => {
    const seeded = seededState(articleSlug);
    if (seeded) {
      setState(current => current.articles[0] === seededArticle ? current : seeded);
      return;
    }
    let active = true;
    setState({ articles: [], loading: true, error: null });
    requestArticles(articleSlug).then(result => {
      if (active) setState({ articles: result.articles, loading: false, error: result.error });
    });
    return () => { active = false; };
  }, [articleSlug]);
  return state;
}
