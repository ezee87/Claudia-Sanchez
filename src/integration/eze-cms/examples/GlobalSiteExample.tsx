import type { CmsGlobalReader, CmsSectionReader } from '../cmsClient'
import { CmsEditable } from '../CmsEditable'
import { CmsEditableGlobal } from '../CmsEditableGlobal'
import { cmsConfig } from '../cmsConfig'
import { useCmsGlobal } from '../useCmsGlobal'
import { useCmsSection } from '../useCmsSection'

type Link = { label: string; href: string }
type Navigation = { brand: string; home: Link; services: Link; booking: Link }
type Footer = { copyright: string; email: Link; phone: Link }
type Hero = { title: string; description: string }

const navigationFallback: Navigation = {
  brand: 'Estudio Ejemplo',
  home: { label: 'Inicio', href: '/' },
  services: { label: 'Servicios', href: '/servicios' },
  booking: { label: 'Reservar', href: 'https://example.com/reservas' },
}
const footerFallback: Footer = {
  copyright: '© Estudio Ejemplo',
  email: { label: 'hola@example.com', href: 'mailto:hola@example.com' },
  phone: { label: '+591 70000000', href: 'tel:+59170000000' },
}
const heroFallback: Hero = { title: 'Página local', description: 'El hero pertenece únicamente a esta página.' }

export function GlobalSiteExample({ readGlobal, readSection }: { readGlobal: CmsGlobalReader; readSection: CmsSectionReader }) {
  const navigation = useCmsGlobal({ config: cmsConfig, groupKey: 'navbar', fallback: navigationFallback, readGlobal })
  const footer = useCmsGlobal({ config: cmsConfig, groupKey: 'footer', fallback: footerFallback, readGlobal })
  const hero = useCmsSection({ config: cmsConfig, pageRoute: '/servicios', sectionKey: 'hero', fallback: heroFallback, readSection })

  const navLinks: Array<[string, Link]> = [['home', navigation.content.home], ['services', navigation.content.services]]
  return <>
    <header>
      <CmsEditableGlobal config={cmsConfig} groupKey="navbar" fieldPath="brand">
        <a href="/">{navigation.content.brand}</a>
      </CmsEditableGlobal>
      <nav aria-label="Principal">
        {navLinks.map(([path, link]) => <CmsEditableGlobal key={path} config={cmsConfig} groupKey="navbar" fieldPath={path}>
          <a href={link.href}>{link.label}</a>
        </CmsEditableGlobal>)}
      </nav>
    </header>

    <main>
      <CmsEditable config={cmsConfig} pageRoute="/servicios" sectionKey="hero" fieldPath="title">
        <h1>{hero.content.title}</h1>
      </CmsEditable>
      <CmsEditable config={cmsConfig} pageRoute="/servicios" sectionKey="hero" fieldPath="description">
        <p>{hero.content.description}</p>
      </CmsEditable>
      <CmsEditableGlobal config={cmsConfig} groupKey="navbar" fieldPath="booking">
        <a href={navigation.content.booking.href} className="primary-button">{navigation.content.booking.label}</a>
      </CmsEditableGlobal>
    </main>

    <footer>
      <CmsEditableGlobal config={cmsConfig} groupKey="footer" fieldPath="copyright">
        <p>{footer.content.copyright}</p>
      </CmsEditableGlobal>
      <CmsEditableGlobal config={cmsConfig} groupKey="footer" fieldPath="email">
        <a href={footer.content.email.href}>{footer.content.email.label}</a>
      </CmsEditableGlobal>
      <CmsEditableGlobal config={cmsConfig} groupKey="footer" fieldPath="phone">
        <a href={footer.content.phone.href}>{footer.content.phone.label}</a>
      </CmsEditableGlobal>
    </footer>
  </>
}
