import type { CmsSectionReader } from '../cmsClient'
import { CmsEditable } from '../CmsEditable'
import { CmsEditableCollection } from '../CmsEditableCollection'
import { cmsConfig } from '../cmsConfig'
import { useCmsSection } from '../useCmsSection'

type CmsLink = { label: string; href: string }
type NavContent = {
  brand: string
  services: CmsLink
  contact: CmsLink
}
type HeroContent = {
  image: string
  title: string
  description: string
  yearsOfExperience: number
  primaryCta: CmsLink
}
type Testimonial = {
  _id: string
  name: string
  quote: string
  photo: string
}
type SocialProofContent = { testimonials: Testimonial[] }

const localNav: NavContent = {
  brand: 'Estudio Ejemplo',
  services: { label: 'Servicios', href: '/servicios' },
  contact: { label: 'Contacto', href: '#contacto' },
}

const localHero: HeroContent = {
  image: '/images/hero-local.webp',
  title: 'Una propuesta clara desde el primer día',
  description: 'Este contenido local permanece disponible durante la carga o ante un error remoto.',
  yearsOfExperience: 12,
  primaryCta: { label: 'Conocer servicios', href: '/servicios' },
}

const localSocialProof: SocialProofContent = {
  testimonials: [{
    _id: 'testimonial-inicial',
    name: 'María',
    quote: 'Una experiencia excelente.',
    photo: '/images/testimonial-local.webp',
  }],
}

type EditableLinkProps = {
  pageRoute: string
  sectionKey: string
  fieldPath: string
  link: CmsLink
  className?: string
}

function EditableLink({ pageRoute, sectionKey, fieldPath, link, className }: EditableLinkProps) {
  return <CmsEditable config={cmsConfig} pageRoute={pageRoute} sectionKey={sectionKey} fieldPath={fieldPath}>
    <a href={link.href} className={className}>{link.label}</a>
  </CmsEditable>
}

export function CompletePage({ readSection }: { readSection: CmsSectionReader }) {
  const pageRoute = '/'
  const nav = useCmsSection({ config: cmsConfig, pageRoute, sectionKey: 'navbar', fallback: localNav, readSection })
  const hero = useCmsSection({ config: cmsConfig, pageRoute, sectionKey: 'hero', fallback: localHero, readSection })
  const socialProof = useCmsSection({ config: cmsConfig, pageRoute, sectionKey: 'social-proof', fallback: localSocialProof, readSection })

  return <main>
    <header>
      <CmsEditable config={cmsConfig} pageRoute={pageRoute} sectionKey="navbar" fieldPath="brand">
        <a href="/">{nav.content.brand}</a>
      </CmsEditable>

      <nav className="desktop-navigation" aria-label="Navegación principal">
        <EditableLink pageRoute={pageRoute} sectionKey="navbar" fieldPath="services" link={nav.content.services} />
        <EditableLink pageRoute={pageRoute} sectionKey="navbar" fieldPath="contact" link={nav.content.contact} />
      </nav>

      <nav className="mobile-navigation" aria-label="Navegación móvil">
        <EditableLink pageRoute={pageRoute} sectionKey="navbar" fieldPath="services" link={nav.content.services} />
        <EditableLink pageRoute={pageRoute} sectionKey="navbar" fieldPath="contact" link={nav.content.contact} />
      </nav>
    </header>

    <section aria-labelledby="hero-title">
      <CmsEditable config={cmsConfig} pageRoute={pageRoute} sectionKey="hero" fieldPath="image">
        <img
          src={hero.content.image}
          alt=""
          width={1600}
          height={900}
          sizes="100vw"
          className="hero-image"
        />
      </CmsEditable>
      <CmsEditable config={cmsConfig} pageRoute={pageRoute} sectionKey="hero" fieldPath="title">
        <h1 id="hero-title">{hero.content.title}</h1>
      </CmsEditable>
      <CmsEditable config={cmsConfig} pageRoute={pageRoute} sectionKey="hero" fieldPath="description">
        <p>{hero.content.description}</p>
      </CmsEditable>
      <CmsEditable config={cmsConfig} pageRoute={pageRoute} sectionKey="hero" fieldPath="yearsOfExperience">
        <strong>{hero.content.yearsOfExperience} años de experiencia</strong>
      </CmsEditable>
      <EditableLink
        pageRoute={pageRoute}
        sectionKey="hero"
        fieldPath="primaryCta"
        link={hero.content.primaryCta}
        className="primary-button"
      />
    </section>

    <CmsEditableCollection config={cmsConfig} pageRoute={pageRoute} sectionKey="social-proof" collectionPath="testimonials">
      <section aria-labelledby="testimonials-title">
        <h2 id="testimonials-title">Testimonios</h2>
        {socialProof.content.testimonials.map((testimonial) =>
          <CmsEditableCollection
            key={testimonial._id}
            config={cmsConfig}
            pageRoute={pageRoute}
            sectionKey="social-proof"
            collectionPath="testimonials"
            itemId={testimonial._id}
          >
            <article>
              <img src={testimonial.photo} alt="" width={160} height={160} loading="lazy" />
              <h3>{testimonial.name}</h3>
              <p>{testimonial.quote}</p>
            </article>
          </CmsEditableCollection>
        )}
      </section>
    </CmsEditableCollection>
  </main>
}
