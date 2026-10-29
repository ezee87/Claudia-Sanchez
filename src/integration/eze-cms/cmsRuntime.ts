import type { CmsArticlesReader, CmsGlobalReader, CmsSectionIndex, CmsSectionIndexReader, CmsSectionReader, CmsSectionRequest } from './cmsClient'
import type { CmsSiteConfig } from './cmsConfig'
import { cmsLocalOnly } from './cmsMode'
import { parseCmsPreviewOrigins } from './cmsOrigins'
import { rememberRevealedSection } from './cmsSnapshot'
import { isCmsSectionHidden, updateCmsSectionVisibility } from './cmsVisibility'
import { articleMediaUrlFrom } from './articleShared.js'

export type CmsIntegration = {
  config: Readonly<CmsSiteConfig>
  readSection: CmsSectionReader
  readGlobal: CmsGlobalReader
  readArticles: CmsArticlesReader
  readSectionIndex: CmsSectionIndexReader
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
        readSectionIndex: clientModule.createPublicSectionIndexReader(client),
      }
    }).catch((error: unknown) => {
      if (import.meta.env.DEV) {
        const message = error instanceof Error ? error.message : 'Error de configuracion desconocido.'
        console.warn('[Eze CMS] No se inicializo el cliente; se utilizara contenido local.', message)
      }
      return null
    })
  : Promise.resolve(null)

/** Espera máxima por las demás lecturas del grupo antes de entregar la propia. */
export const CMS_READ_GROUP_WAIT_MS = 2500
let readGroup: Promise<unknown>[] | null = null

/**
 * Las lecturas iniciadas en la misma tarea (los efectos de un mismo render de React) se entregan juntas, para que la página
 * se actualice de una vez y no sección por sección. Una lectura lenta retrasa al grupo como máximo CMS_READ_GROUP_WAIT_MS.
 */
export function deliverTogether<T>(read: Promise<T>): Promise<T> {
  if (!readGroup) {
    readGroup = []
    setTimeout(() => { readGroup = null }, 0)
  }
  const group = readGroup
  group.push(read)
  return read.then(async (result) => {
    await Promise.race([Promise.allSettled(group), new Promise((resolve) => setTimeout(resolve, CMS_READ_GROUP_WAIT_MS))])
    return result
  })
}

const isObject = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value)
let indexRead: Promise<void> | null = null

/**
 * Aplica el índice público: oculta las secciones con visible distinto de true y revela las que estaban ocultas solo después de
 * leer su contenido, para no pintar el fallback local. Una sección ausente del índice, o cuyo contenido no se pudo leer, no cambia.
 */
export async function applyCmsSectionIndex(siteSlug: string, index: CmsSectionIndex, readSection: CmsSectionReader) {
  const changes = new Map<string, boolean>()
  await Promise.all([...index].map(async ([id, visible]) => {
    const separator = id.lastIndexOf('::')
    const pageRoute = id.slice(0, separator)
    const sectionKey = id.slice(separator + 2)
    if (!visible) { changes.set(id, false); return }
    if (!isCmsSectionHidden(siteSlug, pageRoute, sectionKey)) return
    const result = await readSection({ siteSlug, pageRoute, sectionKey })
    if (result.error || !isObject(result.content)) return
    rememberRevealedSection(siteSlug, pageRoute, sectionKey, result.content)
    changes.set(id, true)
  }))
  updateCmsSectionVisibility(siteSlug, changes)
}

/**
 * Lee el índice público una vez por render (todas las secciones que se montan juntas comparten la lectura) y aplica los
 * cambios de visibilidad junto con el contenido del mismo grupo. Ante cualquier error se conserva la visibilidad del build:
 * un error nunca oculta ni muestra una sección.
 */
export function refreshCmsSectionVisibility(): Promise<void> {
  if (cmsLocalOnly || !hasRequiredEnvironment) return Promise.resolve()
  if (indexRead) return indexRead
  const siteSlug = cmsRuntimeConfig.siteSlug
  const read = deliverTogether((async () => {
    const integration = await cmsIntegration
    if (!integration) return
    const { index, error } = await integration.readSectionIndex({ siteSlug })
    if (error || !index) return
    await applyCmsSectionIndex(siteSlug, index, integration.readSection)
  })().catch(() => undefined))
  indexRead = read
  setTimeout(() => { if (indexRead === read) indexRead = null }, 0)
  return read
}

/** Reader estable para futuras paginas; nunca rompe los fallbacks locales. Cada lectura refresca también la visibilidad. */
export const readCmsSection: CmsSectionReader = (request: CmsSectionRequest) => {
  void refreshCmsSectionVisibility()
  return deliverTogether((async () => {
    const integration = await cmsIntegration
    if (!integration) return { content: null, error: null }
    return integration.readSection(request)
  })())
}

/** Reader estable para contenido compartido; conserva el fallback si el grupo aun no fue publicado. */
export const readCmsGlobal: CmsGlobalReader = (request) => deliverTogether((async () => {
  const integration = await cmsIntegration
  if (!integration) return { content: null, error: null }
  return integration.readGlobal(request)
})())

export const readCmsArticles: CmsArticlesReader = async (request) => {
  if (!hasRequiredEnvironment) {
    return { articles: [], error: new Error('Falta configurar VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.') }
  }
  const integration = await cmsIntegration
  if (!integration) return { articles: [], error: new Error('No se pudo inicializar la conexión con Eze CMS.') }
  return integration.readArticles(request)
}

export function articleMediaUrl(path: unknown): string {
  return articleMediaUrlFrom(cmsRuntimeConfig.supabaseUrl, path)
}
