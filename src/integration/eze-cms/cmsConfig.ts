import { normalizedHttpOrigin, parseCmsPreviewOrigins } from './cmsOrigins'

export type CmsSiteConfig = {
  siteSlug: string
  supabaseUrl: string
  supabasePublishableKey: string
  cmsPreviewOrigin?: string
  /** Orígenes exactos del CMS autorizados a embeber el sitio (p. ej. CMS local y CMS publicado). */
  cmsPreviewOrigins?: readonly string[]
}

function required(value: string, name: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error(`Falta la configuración pública ${name}.`)
  return normalized
}

export function defineCmsConfig(config: CmsSiteConfig): Readonly<CmsSiteConfig> {
  const supabaseUrl = required(config.supabaseUrl, 'supabaseUrl').replace(/\/$/, '')
  const parsedSupabaseUrl = new URL(supabaseUrl)
  if (parsedSupabaseUrl.protocol !== 'https:') throw new Error('supabaseUrl debe utilizar HTTPS.')

  return Object.freeze({
    siteSlug: required(config.siteSlug, 'siteSlug'),
    supabaseUrl,
    supabasePublishableKey: required(config.supabasePublishableKey, 'supabasePublishableKey'),
    cmsPreviewOrigin: normalizedHttpOrigin(config.cmsPreviewOrigin),
    cmsPreviewOrigins: Object.freeze((config.cmsPreviewOrigins ?? []).map((origin) => normalizedHttpOrigin(origin)!)),
  })
}

// Ejemplo para Claudia. Las variables son públicas y deben definirse en su
// propio proyecto Vite; este kit nunca utiliza service_role ni secretos.
export const cmsConfig = defineCmsConfig({
  siteSlug: 'claudia-sanchez',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  cmsPreviewOrigins: parseCmsPreviewOrigins(import.meta.env.VITE_EZE_CMS_ORIGIN),
})
