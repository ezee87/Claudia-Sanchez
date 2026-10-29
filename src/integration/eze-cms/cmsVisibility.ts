import { useSyncExternalStore } from 'react'
import { cmsLocalOnly } from './cmsMode'
import { snapshotHiddenSections } from './cmsSnapshot'

/**
 * Secciones ocultas por sitio ('ruta::clave'). Arranca con las que registró el build, para que una sección oculta no llegue a
 * pintarse nunca, y se actualiza con el índice público que se lee en el navegador (cmsRuntime.ts). En modo local no hay ocultas.
 */
const hiddenBySite = new Map<string, ReadonlySet<string>>()
const listeners = new Set<() => void>()

function hiddenSections(siteSlug: string): ReadonlySet<string> {
  let hidden = hiddenBySite.get(siteSlug)
  if (!hidden) {
    hidden = new Set(cmsLocalOnly ? [] : snapshotHiddenSections(siteSlug))
    hiddenBySite.set(siteSlug, hidden)
  }
  return hidden
}

export function isCmsSectionHidden(siteSlug: string, pageRoute: string, sectionKey: string): boolean {
  return hiddenSections(siteSlug).has(`${pageRoute}::${sectionKey}`)
}

/** Aplica cambios de visibilidad ('ruta::clave' → visible) y avisa a los componentes solo si algo cambió. */
export function updateCmsSectionVisibility(siteSlug: string, changes: ReadonlyMap<string, boolean>) {
  if (cmsLocalOnly) return
  const current = hiddenSections(siteSlug)
  const next = new Set(current)
  for (const [id, visible] of changes) {
    if (visible) next.delete(id)
    else next.add(id)
  }
  if (next.size === current.size && [...next].every((id) => current.has(id))) return
  hiddenBySite.set(siteSlug, next)
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/** Conjunto de secciones ocultas del sitio; vuelve a renderizar cuando cambia. */
export function useCmsHiddenSections(siteSlug: string): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, () => hiddenSections(siteSlug), () => hiddenSections(siteSlug))
}

export function useCmsSectionHidden(siteSlug: string, pageRoute: string, sectionKey: string): boolean {
  return useCmsHiddenSections(siteSlug).has(`${pageRoute}::${sectionKey}`)
}
