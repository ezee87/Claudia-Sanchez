/**
 * Modo de contenido de los hooks de secciones y globales (los artículos no dependen de esto).
 * VITE_CMS_LOCAL_ONLY=true  → solo fallbacks locales, sin consultar Supabase, en cualquier entorno.
 * VITE_CMS_LOCAL_ONLY=false → siempre lee Eze CMS, también en desarrollo.
 * Sin definir               → local en desarrollo y Eze CMS en producción (comportamiento anterior).
 */
export function resolveCmsLocalOnly(value: string | undefined, dev: boolean): boolean {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return dev
}

export const cmsLocalOnly = resolveCmsLocalOnly(import.meta.env.VITE_CMS_LOCAL_ONLY, Boolean(import.meta.env.DEV))
