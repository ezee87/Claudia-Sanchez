import type { CmsSectionReader } from '../cmsClient'
import { CmsEditable } from '../CmsEditable'
import { cmsConfig } from '../cmsConfig'
import { useCmsSection } from '../useCmsSection'

type HeroContent = {
  title: string
  description: string
  cta: { label: string; href: string }
}

const localHero: HeroContent = {
  title: 'Impulsá tu próximo paso profesional',
  description: 'Acompañamiento para tomar decisiones con claridad y confianza.',
  cta: { label: 'Conocé mis servicios', href: '/personas' },
}

export function HomePage({ readSection }: { readSection: CmsSectionReader }) {
  const hero = useCmsSection({
    config: cmsConfig,
    pageRoute: '/',
    sectionKey: 'hero',
    fallback: localHero,
    readSection,
  })

  return <main>
    <section aria-labelledby="hero-title">
      <CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="title">
        <h1 id="hero-title">{hero.content.title}</h1>
      </CmsEditable>
      <CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="description">
        <p>{hero.content.description}</p>
      </CmsEditable>
      <CmsEditable config={cmsConfig} pageRoute="/" sectionKey="hero" fieldPath="cta.label">
        <a href={hero.content.cta.href}>{hero.content.cta.label}</a>
      </CmsEditable>
    </section>
  </main>
}
