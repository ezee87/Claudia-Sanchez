import snapshot from 'virtual:eze-cms-snapshot'

/** Contenido CMS leído durante el build (scripts/cms-snapshot-plugin.mjs). Vale null en modo local y en desarrollo. */
export type CmsSnapshot = {
  site: string
  sections: Record<string, unknown>
  globals: Record<string, unknown>
}

const buildSnapshot: CmsSnapshot | null = snapshot

export function snapshotSection(siteSlug: string, pageRoute: string, sectionKey: string): unknown | null {
  return buildSnapshot?.site === siteSlug ? buildSnapshot.sections[`${pageRoute}::${sectionKey}`] ?? null : null
}

export function snapshotGlobal(siteSlug: string, groupKey: string): unknown | null {
  return buildSnapshot?.site === siteSlug ? buildSnapshot.globals[groupKey] ?? null : null
}
