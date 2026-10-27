import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CmsGlobalLink, GlobalField, useGlobal } from './Cms';
import { content, safeHref } from './content';
import BackToTop from '../ui/BackToTop';
import '../claudia/claudia.css';
import './institutional.css';

export default function Layout({children}) {
  const navbarFallback=content['/'].navbar;
  const footerFallback=content['/'].footer;
  const {content:nav}=useGlobal('institutional-navbar',navbarFallback);
  const {content:footer}=useGlobal('institutional-footer',footerFallback);
  const [open,setOpen]=useState(false);
  const [servicesOpen,setServicesOpen]=useState(false);
  const toggle=useRef(null), menu=useRef(null), services=useRef(null), servicesButton=useRef(null);
  const {pathname,hash}=useLocation();
  const footerMenuBtn=useRef(null);
  const currentYear=new Date().getFullYear();
  useEffect(()=>{setOpen(false);setServicesOpen(false);if(services.current)services.current.open=false;if(hash) requestAnimationFrame(()=>document.getElementById(hash.slice(1))?.scrollIntoView());else window.scrollTo(0,0);},[pathname,hash]);
  useEffect(()=>{
    if(!open)return undefined;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    requestAnimationFrame(()=>menu.current?.querySelector('a,summary')?.focus());
    return()=>{document.body.style.overflow=previousOverflow;};
  },[open]);
  const link=(key,cls)=> <CmsGlobalLink groupKey="institutional-navbar" path={key} value={nav[key]} fallback={navbarFallback[key]} className={cls}/>;
  function closeMenu({restoreFocus=false}={}){setOpen(false);setServicesOpen(false);if(services.current)services.current.open=false;if(restoreFocus)requestAnimationFrame(()=>toggle.current?.focus());}
  function footerMenu(){if(open)closeMenu();else setOpen(true);}
  function closeMenus(e){
    if(e.key==='Escape'){if(services.current?.open){services.current.open=false;setServicesOpen(false);servicesButton.current?.focus();}else closeMenu({restoreFocus:true});}
    if(e.key==='Tab'&&open){const focusable=[toggle.current,...(menu.current?.querySelectorAll('a,summary')||[])].filter(Boolean);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  }
  return <div className={`claudia-root institutional${pathname==='/'?' is-home':''}`} onKeyDown={closeMenus}>
    <GlobalField groupKey="institutional-navbar" path="skipLabel"><a className="skip-link" href="#contenido">{nav.skipLabel}</a></GlobalField>
    {open&&<div className="mobile-nav-backdrop" aria-hidden="true" onClick={()=>closeMenu({restoreFocus:true})}/>}
    <header className={`institutional-header${open?' menu-open':''}`}><div className="site-container header-row">
      {link('brand','institutional-brand')}
      <button ref={toggle} className="nav-toggle" aria-label={open?nav.closeLabel:nav.openLabel} aria-expanded={open} aria-controls="institutional-nav" onClick={()=>open?closeMenu():setOpen(true)}><span>{open?nav.closeLabel:nav.openLabel}</span></button>
      <nav ref={menu} id="institutional-nav" className={open?'is-open':''} aria-label="Principal" onClick={e=>{if(e.target.closest('a'))closeMenu();}}>
        {link('home')}{link('about')}
        <details ref={services} onToggle={e=>setServicesOpen(e.currentTarget.open)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget)){e.currentTarget.open=false;setServicesOpen(false);}}}><GlobalField groupKey="institutional-navbar" path="servicesLabel"><summary ref={servicesButton} aria-expanded={servicesOpen} aria-controls="services-submenu">{nav.servicesLabel}</summary></GlobalField><div id="services-submenu" className="services-menu">{link('people')}{link('business')}{link('community')}</div></details>
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
            <div className="footer-socials" aria-label="Menú y redes sociales">
              <GlobalField groupKey="institutional-footer" path="linkedin"><a className="footer-social-link" href={safeHref(footer.linkedin?.href, footerFallback.linkedin.href)} target="_blank" rel="noopener noreferrer" aria-label={`${footer.linkedin?.label || footerFallback.linkedin.label} (se abre en una pestaña nueva)`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5.1 3.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2ZM3.7 8h2.8v12H3.7V8Zm5 0h2.7v1.6c.5-1 1.6-1.9 3.5-1.9 3 0 4.1 1.8 4.1 4.7V20h-2.9v-6.3c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V20H8.7V8Z" /></svg>
              </a></GlobalField>
              <button ref={footerMenuBtn} type="button" className="footer-menu-link" aria-label="Abrir menú" aria-expanded={open} aria-controls="institutional-nav" onClick={footerMenu}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h16M4 15h16" /></svg><span>Menú</span>
              </button>
            </div>
          </div>
        </div>
        <div className="footer-bottom"><p>© {currentYear} {footer.brand}.<br />Todos los derechos reservados.</p>
          <BackToTop/>
        </div>
      </div>
    </footer>
  </div>;
}
