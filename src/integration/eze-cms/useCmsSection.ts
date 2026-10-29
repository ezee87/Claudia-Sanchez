import { useEffect, useMemo, useState } from 'react'
import type { CmsSectionReader } from './cmsClient'
import type { CmsSiteConfig } from './cmsConfig'
import { authorizedPreviewOrigin } from './CmsEditable'
import { cmsLocalOnly } from './cmsMode'
import { snapshotSection } from './cmsSnapshot'

type JsonObject = Record<string, unknown>

export type UseCmsSectionOptions<T extends JsonObject> = {
  config: CmsSiteConfig
  pageRoute: string
  sectionKey: string
  fallback: T
  readSection: CmsSectionReader
}

export type CmsSectionState<T> = {
  content: T
  loading: boolean
  error: Error | null
  /** local: fallback del repositorio · build: contenido CMS incluido en el build · remote: lectura de Supabase o preview. */
  source: 'local' | 'build' | 'remote'
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function compatibleValue(fallback: unknown, remote: unknown) {
  if (fallback === undefined || fallback === null) return true
  if (Array.isArray(fallback)) return Array.isArray(remote)
  if (isObject(fallback)) return isObject(remote)
  return typeof fallback === typeof remote
}

/** Remote values win; missing remote object properties retain their local fallback. */
export function mergeCmsContent<T extends JsonObject>(fallback: T, remote: unknown): T {
  if (!isObject(remote)) return fallback
  const merged: JsonObject = { ...fallback }
  for (const [key, remoteValue] of Object.entries(remote)) {
    const localValue = merged[key]
    if (!compatibleValue(localValue, remoteValue)) continue
    merged[key] = isObject(localValue) && isObject(remoteValue)
      ? mergeCmsContent(localValue, remoteValue)
      : remoteValue
  }
  return merged as T
}

/** Contenido inicial: el del build (si lo hay) sobre el fallback local. */
export function initialCmsState<T extends JsonObject>(fallback: T, built: unknown, localOnly: boolean): CmsSectionState<T> {
  const fromBuild = !localOnly && isObject(built)
  return { content: fromBuild ? mergeCmsContent(fallback, built) : fallback, loading: !localOnly, error: null, source: fromBuild ? 'build' : 'local' }
}

/** Aplica la lectura remota; si no cambia nada visible conserva el mismo objeto para no volver a renderizar los hijos. */
export function applyRemoteContent<T extends JsonObject>(previous: CmsSectionState<T>, next: T): CmsSectionState<T> {
  const content = JSON.stringify(previous.content) === JSON.stringify(next) ? previous.content : next
  return { content, loading: false, error: null, source: 'remote' }
}

export function useCmsSection<T extends JsonObject>({
  config, pageRoute, sectionKey, fallback, readSection,
}: UseCmsSectionOptions<T>): CmsSectionState<T> {
  const fallbackSignature = JSON.stringify(fallback)
  const stableFallback = useMemo(() => fallback, [fallbackSignature]) // eslint-disable-line react-hooks/exhaustive-deps
  const localOnly = cmsLocalOnly
  const initial = useMemo(
    () => initialCmsState(stableFallback, snapshotSection(config.siteSlug, pageRoute, sectionKey), localOnly),
    [config.siteSlug, localOnly, pageRoute, sectionKey, stableFallback],
  )
  const [state, setState] = useState<CmsSectionState<T>>(initial)

  useEffect(() => {
    if (localOnly) {
      setState({ content: stableFallback, loading: false, error: null, source: 'local' })
      return undefined
    }

    let active = true
    let receivedUpdate = false
    const receiveCmsUpdate = (event: MessageEvent) => {
      if (!active || event.source !== window.parent || event.origin !== authorizedPreviewOrigin(config)) return
      const message = event.data
      if (!message || typeof message !== 'object' || message.type !== 'EZE_CMS_UPDATE_SECTION') return
      if (message.site !== config.siteSlug || message.pageRoute !== pageRoute || message.sectionKey !== sectionKey || !isObject(message.content)) return
      receivedUpdate = true
      setState({ content: mergeCmsContent(stableFallback, message.content), loading: false, error: null, source: 'remote' })
    }

    if (typeof window !== 'undefined') window.addEventListener('message', receiveCmsUpdate)
    setState(initial)

    // Ante error o sección sin publicar se conserva el contenido inicial (el del build o, sin él, el local).
    void readSection({ siteSlug: config.siteSlug, pageRoute, sectionKey }).then((result) => {
      if (!active || receivedUpdate) return
      if (result.error || !isObject(result.content)) {
        setState({ ...initial, loading: false, error: result.error })
        return
      }
      const remote = mergeCmsContent(stableFallback, result.content)
      setState((previous) => applyRemoteContent(previous, remote))
    }).catch((error: unknown) => {
      if (!active || receivedUpdate) return
      setState({ ...initial, loading: false, error: error instanceof Error ? error : new Error('No se pudo cargar la sección.') })
    })

    return () => {
      active = false
      if (typeof window !== 'undefined') window.removeEventListener('message', receiveCmsUpdate)
    }
  }, [config.siteSlug, initial, localOnly, pageRoute, sectionKey, readSection, stableFallback])

  return state
}
