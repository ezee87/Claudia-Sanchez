import type { CmsArticlesReader, CmsGlobalReader, CmsSectionIndex, CmsSectionIndexReader, CmsSectionReader, CmsSectionRequest } from './cmsClient'
import type { CmsSiteConfig } from './cmsConfig'
import { authorizedPreviewOrigin } from './CmsEditable'
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
// Cambia con cada aviso de visibilidad del preview: una lectura del índice iniciada antes no lo pisa con datos viejos.
let previewVisibilityGeneration = 0

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
  const generation = previewVisibilityGeneration
  const read = deliverTogether((async () => {
    const integration = await cmsIntegration
    if (!integration) return
    const { index, error } = await integration.readSectionIndex({ siteSlug })
    if (error || !index || generation !== previewVisibilityGeneration) return
    await applyCmsSectionIndex(siteSlug, index, integration.readSection)
  })().catch(() => undefined))
  indexRead = read
  setTimeout(() => { if (indexRead === read) indexRead = null }, 0)
  return read
}

/**
 * Aviso de Eze CMS tras guardar la visibilidad de una sección (solo en la vista previa autorizada). Ocultar desmonta la
 * sección de inmediato; mostrarla exige su contenido (el que envía el CMS o, si falta, el de la lectura pública), para no
 * pintar el fallback local. Devuelve false si el mensaje no es válido o no se pudo aplicar.
 */
export async function applyPreviewSectionVisibility(siteSlug: string, data: unknown, readSection: CmsSectionReader): Promise<boolean> {
  if (!isObject(data)) return false
  const message = data as Record<string, unknown>
  if (message.type !== 'EZE_CMS_UPDATE_SECTION_VISIBILITY' || message.site !== siteSlug || typeof message.pageRoute !== 'string'
    || typeof message.sectionKey !== 'string' || typeof message.visible !== 'boolean') return false
  const { pageRoute, sectionKey } = message
  const generation = ++previewVisibilityGeneration
  if (!message.visible) {
    updateCmsSectionVisibility(siteSlug, new Map([[`${pageRoute}::${sectionKey}`, false]]))
    return true
  }
  let content = isObject(message.content) ? message.content : null
  if (!content) {
    const result = await readSection({ siteSlug, pageRoute, sectionKey })
    content = !result.error && isObject(result.content) ? result.content : null
  }
  // Si mientras tanto llegó otro aviso, manda el más reciente.
  if (!content || generation !== previewVisibilityGeneration) return false
  rememberRevealedSection(siteSlug, pageRoute, sectionKey, content)
  updateCmsSectionVisibility(siteSlug, new Map([[`${pageRoute}::${sectionKey}`, true]]))
  return true
}

// Solo dentro del iframe de Eze CMS con ?cmsPreview=true y un origen autorizado: los visitantes nunca reciben estos avisos.
if (typeof window !== 'undefined' && window.parent !== window && !cmsLocalOnly) {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== authorizedPreviewOrigin(cmsRuntimeConfig)) return
    void applyPreviewSectionVisibility(cmsRuntimeConfig.siteSlug, event.data, async (request) => {
      const integration = await cmsIntegration
      return integration ? integration.readSection(request) : { content: null, error: null }
    })
  })
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
