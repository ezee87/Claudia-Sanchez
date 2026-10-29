import { Fragment, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CmsLink, Field, useGlobal, useSection } from './Cms';
import { content, formatDate, safeHref, safeImage } from './content';
import { articleMediaUrl } from '../../integration/eze-cms/cmsRuntime';
import { useCmsArticles } from '../../integration/eze-cms/useCmsArticles';
import { articleCoverAlt } from '../../integration/eze-cms/articleShared.js';
import Seo from './Seo';

const editorialDate = article => article.original_published_at || article.published_at;

// `rest` receives the CMS preview handlers when the status text is wrapped in <Field>.
function ArticleStatus({ children, kind = '', ...rest }) {
  return <div className={`article-status ${kind}`} {...rest}>{children}</div>;
}

const listingField = (path, child) => <Field route="/articulos" section="listado" path={path}>{child}</Field>;
const detailField = (section, path, child) => <Field route="/articulos/:slug" section={section} path={path}>{child}</Field>;

function ArticleCard({ article, readLabel }) {
  const cover = articleMediaUrl(article.cover_image);
  const date = editorialDate(article);
  return <article className="article-card">
    <Link to={`/articulos/${article.slug}`} aria-label={`Leer ${article.title}`}>
      <div className="article-cover">{safeImage(cover) && <img src={cover} alt="" width="720" height="480" loading="lazy" />}</div>
      <div className="article-card-copy"><div className="article-card-text"><time dateTime={date}>{formatDate(date)}</time><h3>{article.title}</h3>{article.excerpt && <p>{article.excerpt}</p>}</div>{listingField('readLabel', <span className="article-read">{readLabel} <span aria-hidden="true">→</span></span>)}</div>
    </Link>
  </article>;
}

// El CMS no expone categorías ni etiquetas: se toman los vecinos por fecha (anterior y siguiente), excluyendo el actual.
function relatedArticles(all, current) {
  const index = all.findIndex(a => a.id === current.id);
  if (index < 0) return all.slice(0, 2);
  const older = all.slice(index + 1);
  const newer = all.slice(0, index).reverse();
  const picks = [older[0], newer[0]].filter(Boolean);
  return [...picks, ...older.slice(1), ...newer.slice(1)].slice(0, 2);
}

const PAGE_SIZE = 6;

export function ArticleCards({ limit, paged = false }) {
  const { articles, loading, error } = useCmsArticles();
  const { content: labels } = useSection('/articulos', 'listado');
  const [count, setCount] = useState(PAGE_SIZE);
  const gridRef = useRef(null);
  if (loading) return listingField('loading', <ArticleStatus>{labels.loading}</ArticleStatus>);
  if (error) return <ArticleStatus kind="is-error">{listingField('error', <strong>{labels.error}</strong>)}<span>{error.message}</span></ArticleStatus>;
  const total = articles.length;
  const visible = paged ? articles.slice(0, count) : articles.slice(0, limit);
  if (!visible.length) return listingField('empty', <ArticleStatus>{labels.empty}</ArticleStatus>);
  const allShown = visible.length >= total;
  const showLess = () => {
    setCount(PAGE_SIZE);
    // Evita quedar desplazado en una zona vacía tras colapsar la lista.
    const top = gridRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: window.scrollY + top - 120, behavior: smooth ? 'smooth' : 'auto' });
    }
  };
  const grid = <div className="article-grid" ref={gridRef}>{visible.map(article => <ArticleCard key={article.id} article={article} readLabel={labels.readLabel} />)}</div>;
  if (!paged) return grid;
  // Separate text nodes per placeholder, as the original JSX produced: a single joined string renders with different kerning.
  const countText = labels.countTemplate.split(/(\{n\}|\{total\})/).filter(Boolean)
    .map(part => part === '{n}' ? visible.length : part === '{total}' ? total : part);
  return <>{grid}{total > PAGE_SIZE && <div className="article-pager">
    {listingField('countTemplate', <p className="article-count" role="status" aria-live="polite">{countText}</p>)}
    {allShown
      ? listingField('lessLabel', <button type="button" className="editorial-button article-more" onClick={showLess}>{labels.lessLabel}</button>)
      : listingField('moreLabel', <button type="button" className="editorial-button article-more" onClick={() => setCount(c => Math.min(c + PAGE_SIZE, total))}>{labels.moreLabel}</button>)}
  </div>}</>;
}

function renderMarks(node, content) {
  return (node.marks || []).reduce((child, mark, index) => {
    if (mark.type === 'bold') return <strong key={index}>{child}</strong>;
    if (mark.type === 'italic') return <em key={index}>{child}</em>;
    if (mark.type === 'strike') return <s key={index}>{child}</s>;
    if (mark.type === 'code') return <code key={index}>{child}</code>;
    if (mark.type === 'link') {
      const href = safeHref(mark.attrs?.href, '');
      return href ? <a key={index} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{child}</a> : child;
    }
    return child;
  }, content);
}

function RichNode({ node, nodeKey }) {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'text') return <Fragment key={nodeKey}>{renderMarks(node, node.text || '')}</Fragment>;
  const children = Array.isArray(node.content) ? node.content.map((child, index) => <RichNode key={`${nodeKey}-${index}`} node={child} nodeKey={`${nodeKey}-${index}`} />) : null;
  if (node.type === 'doc') return <Fragment key={nodeKey}>{children}</Fragment>;
  if (node.type === 'paragraph') return <p key={nodeKey}>{children}</p>;
  if (node.type === 'heading') { const level = Math.min(4, Math.max(2, Number(node.attrs?.level) || 2)); const Tag = `h${level}`; return <Tag key={nodeKey}>{children}</Tag>; }
  if (node.type === 'blockquote') return <blockquote key={nodeKey}>{children}</blockquote>;
  if (node.type === 'bulletList') return <ul key={nodeKey}>{children}</ul>;
  if (node.type === 'orderedList') return <ol key={nodeKey} start={Number(node.attrs?.start) || 1}>{children}</ol>;
  if (node.type === 'listItem') return <li key={nodeKey}>{children}</li>;
  if (node.type === 'horizontalRule') return <hr key={nodeKey} />;
  if (node.type === 'hardBreak') return <br key={nodeKey} />;
  if (node.type === 'image') { const src = safeImage(articleMediaUrl(node.attrs?.src || node.attrs?.storagePath)); return src ? <figure key={nodeKey}><img src={src} alt={node.attrs?.alt || ''} loading="lazy" />{node.attrs?.title && <figcaption>{node.attrs.title}</figcaption>}</figure> : null; }
  return <Fragment key={nodeKey}>{children}</Fragment>;
}

export function ArticleBody({ content }) {
  return <div className="article-body"><RichNode node={content} nodeKey="root" /></div>;
}

export function ArticleDetail() {
  const { slug } = useParams();
  const { content: header } = useSection('/articulos/:slug', 'encabezado');
  const { content: body } = useSection('/articulos/:slug', 'contenido');
  const { content: footer, hidden: footerHidden } = useSection('/articulos/:slug', 'pie-articulo');
  const { content: labels } = useSection('/articulos', 'listado');
  const { content: site } = useGlobal('institutional-footer', content['/'].footer);
  const { articles, loading, error } = useCmsArticles(slug);
  const { articles: allArticles } = useCmsArticles();
  const article = articles[0];
  const date = article && editorialDate(article);
  const cover = article && articleMediaUrl(article.cover_image);
  const related = article ? relatedArticles(allArticles, article) : [];
  // La firma pertenece a pie-articulo: si esa sección está oculta, el autor sale del global del pie.
  const author = (!footerHidden && footer.signature?.replace(/^Por\s+/i, '')) || site.brand;
  const sourceHref = article?.source_url ? safeHref(article.source_url, '') : '';
  return <><Seo route="/articulos/:slug" article={article} missing={!loading && !error && !article} /><main className="site-container article-detail">
    {detailField('encabezado', 'backLabel', <Link className="article-back" to="/articulos"><span aria-hidden="true">←</span> {header.backLabel}</Link>)}
    {loading && <ArticleStatus>{detailField('contenido', 'loading', <h1>{body.loading}</h1>)}</ArticleStatus>}
    {error && <ArticleStatus kind="is-error">{detailField('contenido', 'error', <strong>{body.error}</strong>)}<span>{error.message}</span></ArticleStatus>}
    {!loading && !error && !article && <ArticleStatus>{detailField('contenido', 'missingTitle', <h1>{body.missingTitle}</h1>)}{detailField('contenido', 'unavailable', <span>{body.unavailable}</span>)}</ArticleStatus>}
    {article && <article>
      <header className="article-detail-header">
        <Field route="/articulos/:slug" section="encabezado" path="collection"><p className="eyebrow">{header.collection}</p></Field>
        <h1>{article.title}</h1>
        <p className="article-meta"><time dateTime={date}>{formatDate(date)}</time><span aria-hidden="true">·</span><span>{author}</span></p>
      </header>
      {safeImage(cover) && <figure className="article-figure"><img className="article-hero" src={cover} alt={articleCoverAlt(article)} width="1000" height="650" /></figure>}
      <ArticleBody content={article.content} />
      <footer className="article-end">
        <div className="article-author">
          <Field route="/articulos/:slug" section="pie-articulo" path="signature"><p className="article-signature">{footer.signature}</p></Field>
          {site.line && <p className="article-author-line">{site.line}</p>}
        </div>
        {sourceHref && detailField('pie-articulo', 'sourceLabel', <a className="article-source" href={sourceHref} target="_blank" rel="noopener noreferrer">{footer.sourceLabel} <span aria-hidden="true">↗</span></a>)}
      </footer>
    </article>}
    {article && related.length > 0 && <aside className="article-related" aria-labelledby="article-related-title">
      {detailField('pie-articulo', 'relatedTitle', <h2 id="article-related-title">{footer.relatedTitle}</h2>)}
      <div className="article-grid">{related.map(item => <ArticleCard key={item.id} article={item} readLabel={labels.readLabel} />)}</div>
    </aside>}
    <CmsLink route="/articulos/:slug" section="pie-articulo" path="back" value={footer.back} className="article-back-all" />
  </main></>;
}
