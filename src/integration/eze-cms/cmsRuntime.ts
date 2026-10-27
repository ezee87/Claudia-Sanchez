import type { CmsArticlesReader, CmsGlobalReader, CmsSectionReader, CmsSectionRequest } from './cmsClient'
import type { CmsSiteConfig } from './cmsConfig'
import { parseCmsPreviewOrigins } from './cmsOrigins'

export type CmsIntegration = {
  config: Readonly<CmsSiteConfig>
  readSection: CmsSectionReader
  readGlobal: CmsGlobalReader
  readArticles: CmsArticlesReader
}

const hasRequiredEnvironment = Boolean(
  import.meta.env.VITE_SUPABASE_URL?.trim()
  && import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
)

/** Configuracion publica segura para hooks y seleccion visual aun sin Supabase. */
export const cmsRuntimeConfig: Readonly<CmsSiteConfig> = Object.freeze({
  siteSlug: 'claudia-sanchez',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  cmsPreviewOrigins: Object.freeze(parseCmsPreviewOrigins(import.meta.env.VITE_EZE_CMS_ORIGIN)),
})

/** Inicializacion opcional y unica, fuera de los componentes React. */
export const cmsIntegration: Promise<CmsIntegration | null> = hasRequiredEnvironment
  ? Promise.all([import('./cmsConfig'), import('./cmsClient')]).then(([configModule, clientModule]) => {
      const client = clientModule.createCmsClient(configModule.cmsConfig)
      return {
        config: configModule.cmsConfig,
        readSection: clientModule.createPublicSectionReader(client),
        readGlobal: clientModule.createPublicGlobalReader(client),
        readArticles: clientModule.createPublicArticlesReader(client),
      }
    }).catch((error: unknown) => {
      if (import.meta.env.DEV) {
        const message = error instanceof Error ? error.message : 'Error de configuracion desconocido.'
        console.warn('[Eze CMS] No se inicializo el cliente; se utilizara contenido local.', message)
      }
      return null
    })
  : Promise.resolve(null)

/** Reader estable para futuras paginas; nunca rompe los fallbacks locales. */
export const readCmsSection: CmsSectionReader = async (request: CmsSectionRequest) => {
  const integration = await cmsIntegration
  if (!integration) return { content: null, error: null }
  return integration.readSection(request)
}

/** Reader estable para contenido compartido; conserva el fallback si el grupo aun no fue publicado. */
export const readCmsGlobal: CmsGlobalReader = async (request) => {
  const integration = await cmsIntegration
  if (!integration) return { content: null, error: null }
  return integration.readGlobal(request)
}

export const readCmsArticles: CmsArticlesReader = async (request) => {
  if (!hasRequiredEnvironment) {
    return { articles: [], error: new Error('Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.') }
  }
  const integration = await cmsIntegration
  if (!integration) return { articles: [], error: new Error('No se pudo inicializar la conexión con Eze CMS.') }
  return integration.readArticles(request)
}

export function articleMediaUrl(path: unknown): string {
  if (typeof path !== 'string' || !path.trim()) return ''
  if (/^https:\/\//i.test(path)) return path
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(path)) return ''
  const base = cmsRuntimeConfig.supabaseUrl.replace(/\/$/, '')
  return base ? `${base}/storage/v1/object/public/article-media/${path.split('/').map(encodeURIComponent).join('/')}` : ''
}
