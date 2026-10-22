import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CmsGlobalLink, GlobalField, useGlobal } from './Cms';
import { content, safeHref } from './content';
import '../claudia/claudia.css';
import './institutional.css';

export default function Layout({children}) {
  const navbarFallback=content['/'].navbar;
  const footerFallback=content['/'].footer;
  const {content:nav}=useGlobal('institutional-navbar',navbarFallback);
  const {content:footer}=useGlobal('institutional-footer',footerFallback);
  const [open,setOpen]=useState(false);
  const toggle=useRef(null), services=useRef(null), servicesButton=useRef(null);
  const {pathname,hash}=useLocation();
  const currentYear=new Date().getFullYear();
  useEffect(()=>{setOpen(false); if(hash) requestAnimationFrame(()=>document.getElementById(hash.slice(1))?.scrollIntoView());else window.scrollTo(0,0);},[pathname,hash]);
  const link=(key,cls)=> <CmsGlobalLink groupKey="institutional-navbar" path={key} value={nav[key]} fallback={navbarFallback[key]} className={cls}/>;
  function closeMenus(e){if(e.key==='Escape'){if(services.current?.open){services.current.open=false;servicesButton.current?.focus();}else{setOpen(false);toggle.current?.focus();}}}
  return <div className={`claudia-root institutional${pathname==='/'?' is-home':''}`} onKeyDown={closeMenus}>
    <GlobalField groupKey="institutional-navbar" path="skipLabel"><a className="skip-link" href="#contenido">{nav.skipLabel}</a></GlobalField>
    <header className="institutional-header"><div className="site-container header-row">
      {link('brand','institutional-brand')}
      <button ref={toggle} className="nav-toggle" aria-expanded={open} aria-controls="institutional-nav" onClick={()=>setOpen(!open)}>{open?nav.closeLabel:nav.openLabel}</button>
      <nav id="institutional-nav" className={open?'is-open':''} aria-label="Principal" onClick={e=>{if(e.target.closest('a')){setOpen(false);if(services.current)services.current.open=false;}}}>
        {link('home')}{link('about')}
        <details ref={services} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))e.currentTarget.open=false;}}><GlobalField groupKey="institutional-navbar" path="servicesLabel"><summary ref={servicesButton}>{nav.servicesLabel}</summary></GlobalField><div className="services-menu">{link('people')}{link('business')}{link('community')}</div></details>
        {link('articles')}{link('contact')}
      </nav>
    </div></header>
    <main id="contenido" tabIndex={-1}>{children}</main>
    <footer className="institutional-footer" data-tone="dark">
      <div className="footer-arcs" aria-hidden="true" />
      <div className="site-container footer-shell">
        <div className="footer-main">
          <div className="footer-identity">
            <GlobalField groupKey="institutional-footer" path="brand"><p className="footer-brand">{footer.brand}</p></GlobalField>
            <GlobalField groupKey="institutional-footer" path="line"><p className="footer-description">{footer.line}</p></GlobalField>
            <div className="footer-socials" aria-label="Redes sociales">
              <GlobalField groupKey="institutional-footer" path="linkedin"><a className="footer-social-link" href={safeHref(footer.linkedin?.href, footerFallback.linkedin.href)} target="_blank" rel="noopener noreferrer" aria-label={`${footer.linkedin?.label || footerFallback.linkedin.label} (se abre en una pestaña nueva)`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5.1 3.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM3.7 8h2.8v12H3.7V8Zm5 0h2.7v1.6c.5-1 1.6-1.9 3.5-1.9 3 0 4.1 1.8 4.1 4.7V20h-2.9v-6.3c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V20H8.7V8Z" /></svg>
              </a></GlobalField>
            </div>
          </div>
          <nav className="footer-nav" aria-label="Pie de página">{['home','people','business','community','articles','contact'].map(k=><span key={k}>{link(k)}</span>)}</nav>
        </div>
        <div className="footer-bottom"><p>© {currentYear} {footer.brand}. Todos los derechos reservados.</p></div>
      </div>
    </footer>
  </div>;
}
