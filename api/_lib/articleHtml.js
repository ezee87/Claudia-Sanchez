// HTML estático del artículo para api/articulo.js. El cuerpo replica RichNode/renderMarks de
// src/components/institutional/articles.jsx (scripts/test-article-ssr.mjs verifica que el resultado sea idéntico).
import { safeHref, safeImage } from '../../src/utils/safeUrl.js';
import { ARTICLE_AUTHOR, articleMediaUrlFrom, editorialDate, formatDate } from '../../src/integration/eze-cms/articleShared.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
/** Mismo escape que React para texto y atributos. */
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ESCAPES[char]);

// < > & y los separadores de línea U+2028/U+2029 se emiten como escapes JSON: el script no puede cerrarse ni abrir comentarios.
const UNSAFE_IN_SCRIPT = new RegExp(`[<>&${String.fromCharCode(0x2028, 0x2029)}]`, 'g');
export const jsonForScript = value => JSON.stringify(value)
  .replace(UNSAFE_IN_SCRIPT, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);

function renderMarks(node, html) {
  return (node.marks || []).reduce((child, mark) => {
    if (mark.type === 'bold') return `<strong>${child}</strong>`;
    if (mark.type === 'italic') return `<em>${child}</em>`;
    if (mark.type === 'strike') return `<s>${child}</s>`;
    if (mark.type === 'code') return `<code>${child}</code>`;
    if (mark.type === 'link') {
      const href = safeHref(mark.attrs?.href, '');
      if (!href) return child;
      const external = href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${escapeHtml(href)}"${external}>${child}</a>`;
    }
    return child;
  }, html);
}

function renderNode(node, mediaBase) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'text') return renderMarks(node, escapeHtml(node.text || ''));
  const children = Array.isArray(node.content) ? node.content.map(child => renderNode(child, mediaBase)).join('') : '';
  switch (node.type) {
    case 'paragraph': return `<p>${children}</p>`;
    case 'heading': { const level = Math.min(4, Math.max(2, Number(node.attrs?.level) || 2)); return `<h${level}>${children}</h${level}>`; }
    case 'blockquote': return `<blockquote>${children}</blockquote>`;
    case 'bulletList': return `<ul>${children}</ul>`;
    case 'orderedList': return `<ol start="${Number(node.attrs?.start) || 1}">${children}</ol>`;
    case 'listItem': return `<li>${children}</li>`;
    case 'horizontalRule': return '<hr/>';
    case 'hardBreak': return '<br/>';
    case 'image': {
      const src = safeImage(articleMediaUrlFrom(mediaBase, node.attrs?.src || node.attrs?.storagePath));
      if (!src) return '';
      const caption = node.attrs?.title ? `<figcaption>${escapeHtml(node.attrs.title)}</figcaption>` : '';
      return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(node.attrs?.alt || '')}" loading="lazy"/>${caption}</figure>`;
    }
    default: return children;
  }
}

export const renderArticleBody = (content, mediaBase) => `<div class="article-body">${renderNode(content, mediaBase)}</div>`;

/** Estructura y clases de ArticleDetail, para que el HTML previo a React se vea igual con los estilos del sitio. */
export function renderArticleMain(article, { labels, mediaBase }) {
  const header = labels.encabezado || {};
  const footer = labels['pie-articulo'] || {};
  const date = editorialDate(article);
  const validDate = Number.isFinite(Date.parse(date));
  const cover = safeImage(articleMediaUrlFrom(mediaBase, article.cover_image));
  const author = footer.signature?.replace(/^Por\s+/i, '') || ARTICLE_AUTHOR;
  const source = article.source_url ? safeHref(article.source_url, '') : '';
  const back = footer.back?.href ? safeHref(footer.back.href, '/articulos') : '';
  return '<main class="site-container article-detail">'
    + (header.backLabel ? `<a class="article-back" href="/articulos"><span aria-hidden="true">←</span> ${escapeHtml(header.backLabel)}</a>` : '')
    + '<article><header class="article-detail-header">'
    + (header.collection ? `<p class="eyebrow">${escapeHtml(header.collection)}</p>` : '')
    + `<h1>${escapeHtml(article.title)}</h1>`
    + '<p class="article-meta">'
    + (validDate ? `<time datetime="${escapeHtml(date)}">${escapeHtml(formatDate(date))}</time><span aria-hidden="true">·</span>` : '')
    + `<span>${escapeHtml(author)}</span></p></header>`
    + (cover ? `<figure class="article-figure"><img class="article-hero" src="${escapeHtml(cover)}" alt="" width="1000" height="650"/></figure>` : '')
    + renderArticleBody(article.content, mediaBase)
    + '<footer class="article-end"><div class="article-author">'
    + (footer.signature ? `<p class="article-signature">${escapeHtml(footer.signature)}</p>` : '')
    + '</div>'
    + (source && footer.sourceLabel ? `<a class="article-source" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(footer.sourceLabel)} <span aria-hidden="true">↗</span></a>` : '')
    + '</footer></article>'
    + (back && footer.back.label ? `<a class="article-back-all" href="${escapeHtml(back)}">${escapeHtml(footer.back.label)}</a>` : '')
    + '</main>';
}
