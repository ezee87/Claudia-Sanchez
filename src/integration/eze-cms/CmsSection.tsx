import { useEffect, useRef, type ReactNode } from 'react'
import { ScrollTrigger } from '../../utils/gsap'
import type { CmsSiteConfig } from './cmsConfig'
import { refreshCmsSectionVisibility } from './cmsRuntime'
import { useCmsSectionHidden } from './cmsVisibility'

type Props = {
  config: CmsSiteConfig
  pageRoute: string
  sectionKey: string
  children: ReactNode
}

/**
 * Bloque de una sección del CMS: si está oculta no se monta (ni su contenido del build ni su fallback local). La visibilidad
 * inicial es la del build, así que no hay parpadeo; el índice leído en el navegador la corrige si cambió después del despliegue.
 */
export function CmsSection({ config, pageRoute, sectionKey, children }: Props) {
  const hidden = useCmsSectionHidden(config.siteSlug, pageRoute, sectionKey)
  const mounted = useRef(false)

  // Un bloque oculto no monta sus hooks: la lectura del índice tiene que pedirla el propio bloque.
  useEffect(() => { void refreshCmsSectionVisibility() }, [pageRoute, sectionKey])

  // Si la visibilidad cambia con la página abierta, se recalculan las posiciones de las animaciones con scroll.
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return undefined }
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [hidden])

  return hidden ? null : children
}
