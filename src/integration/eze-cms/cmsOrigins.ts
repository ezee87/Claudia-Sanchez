export function normalizedHttpOrigin(value: string | undefined) {
  if (!value?.trim()) return undefined
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== url.href.replace(/\/$/, '')) {
    throw new Error('cmsPreviewOrigin debe ser un origen HTTP(S), sin ruta, query ni hash.')
  }
  return url.origin
}

/**
 * `VITE_EZE_CMS_ORIGIN` admite uno o varios orígenes separados por coma (p. ej. el CMS local y el publicado).
 * Descarta las entradas que no son orígenes HTTP(S) exactos: sin entradas válidas, el modo preview queda desactivado.
 */
export function parseCmsPreviewOrigins(value: string | undefined): string[] {
  return [...new Set((value ?? '').split(',').map((entry) => entry.trim()).filter(Boolean).flatMap((entry) => {
    try { return [normalizedHttpOrigin(entry)!] } catch { return [] }
  }))]
}
