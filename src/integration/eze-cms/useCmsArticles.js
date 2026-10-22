import { useEffect, useState } from 'react';
import { cmsRuntimeConfig, readCmsArticles } from './cmsRuntime';

let allArticlesRequest;

function requestArticles(articleSlug) {
  if (articleSlug) return readCmsArticles({ siteSlug: cmsRuntimeConfig.siteSlug, articleSlug });
  allArticlesRequest ??= readCmsArticles({ siteSlug: cmsRuntimeConfig.siteSlug });
  return allArticlesRequest;
}

export function useCmsArticles(articleSlug) {
  const [state, setState] = useState({ articles: [], loading: true, error: null });
  useEffect(() => {
    let active = true;
    setState({ articles: [], loading: true, error: null });
    requestArticles(articleSlug).then(result => {
      if (active) setState({ articles: result.articles, loading: false, error: result.error });
    });
    return () => { active = false; };
  }, [articleSlug]);
  return state;
}
