export type CmsSiteConfig = {
  siteSlug: string
  supabaseUrl: string
  supabasePublishableKey: string
  cmsPreviewOrigin?: string
}

function required(value: string, name: string) {
  const normalized = value.trim()
  if (!normalized) throw new Error(`Falta la configuración pública ${name}.`)
  return normalized
}

function normalizedHttpOrigin(value: string | undefined) {
  if (!value?.trim()) return undefined
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== url.href.replace(/\/$/, '')) {
    throw new Error('cmsPreviewOrigin debe ser un origen HTTP(S), sin ruta, query ni hash.')
  }
  return url.origin
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
  })
}

// Ejemplo para Claudia. Las variables son públicas y deben definirse en su
// propio proyecto Vite; este kit nunca utiliza service_role ni secretos.
export const cmsConfig = defineCmsConfig({
  siteSlug: 'claudia-sanchez',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  cmsPreviewOrigin: import.meta.env.VITE_EZE_CMS_ORIGIN,
})
