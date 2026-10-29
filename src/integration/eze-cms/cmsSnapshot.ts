import snapshot from 'virtual:eze-cms-snapshot'

/** Contenido CMS leído durante el build (scripts/cms-snapshot-plugin.mjs). Vale null en modo local y en desarrollo. */
export type CmsSnapshot = {
  site: string
  sections: Record<string, unknown>
  /** Secciones ocultas ('ruta::clave'): existen en Supabase, pero el build no tiene ni debe tener su contenido. */
  hidden?: string[]
  globals: Record<string, unknown>
}

const buildSnapshot: CmsSnapshot | null = snapshot

/** Contenido leído en el navegador de una sección que estaba oculta en el build y volvió a mostrarse. */
const revealedSections = new Map<string, unknown>()

export function snapshotSection(siteSlug: string, pageRoute: string, sectionKey: string): unknown | null {
  const id = `${pageRoute}::${sectionKey}`
  if (revealedSections.has(`${siteSlug}\n${id}`)) return revealedSections.get(`${siteSlug}\n${id}`) ?? null
  return buildSnapshot?.site === siteSlug ? buildSnapshot.sections[id] ?? null : null
}

export function rememberRevealedSection(siteSlug: string, pageRoute: string, sectionKey: string, content: unknown) {
  revealedSections.set(`${siteSlug}\n${pageRoute}::${sectionKey}`, content)
}

export function snapshotHiddenSections(siteSlug: string): string[] {
  return buildSnapshot?.site === siteSlug ? buildSnapshot.hidden ?? [] : []
}

export function snapshotGlobal(siteSlug: string, groupKey: string): unknown | null {
  return buildSnapshot?.site === siteSlug ? buildSnapshot.globals[groupKey] ?? null : null
}
