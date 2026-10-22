import { useEffect, useMemo, useState } from 'react'
import type { CmsSectionReader } from './cmsClient'
import type { CmsSiteConfig } from './cmsConfig'
import { previewIsAuthorized } from './CmsEditable'

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
  source: 'local' | 'remote'
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

export function useCmsSection<T extends JsonObject>({
  config, pageRoute, sectionKey, fallback, readSection,
}: UseCmsSectionOptions<T>): CmsSectionState<T> {
  const fallbackSignature = JSON.stringify(fallback)
  const stableFallback = useMemo(() => fallback, [fallbackSignature]) // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState<CmsSectionState<T>>({ content: stableFallback, loading: true, error: null, source: 'local' })

  useEffect(() => {
    let active = true
    let receivedUpdate = false
    const receiveCmsUpdate = (event: MessageEvent) => {
      if (!active || !previewIsAuthorized(config) || event.source !== window.parent || event.origin !== config.cmsPreviewOrigin) return
      const message = event.data
      if (!message || typeof message !== 'object' || message.type !== 'EZE_CMS_UPDATE_SECTION') return
      if (message.site !== config.siteSlug || message.pageRoute !== pageRoute || message.sectionKey !== sectionKey || !isObject(message.content)) return
      receivedUpdate = true
      setState({ content: mergeCmsContent(stableFallback, message.content), loading: false, error: null, source: 'remote' })
    }

    if (typeof window !== 'undefined') window.addEventListener('message', receiveCmsUpdate)
    setState({ content: stableFallback, loading: true, error: null, source: 'local' })

    void readSection({ siteSlug: config.siteSlug, pageRoute, sectionKey }).then((result) => {
      if (!active || receivedUpdate) return
      if (result.error || !isObject(result.content)) {
        setState({ content: stableFallback, loading: false, error: result.error, source: 'local' })
        return
      }
      setState({ content: mergeCmsContent(stableFallback, result.content), loading: false, error: null, source: 'remote' })
    }).catch((error: unknown) => {
      if (!active || receivedUpdate) return
      setState({ content: stableFallback, loading: false, error: error instanceof Error ? error : new Error('No se pudo cargar la sección.'), source: 'local' })
    })

    return () => {
      active = false
      if (typeof window !== 'undefined') window.removeEventListener('message', receiveCmsUpdate)
    }
  }, [config.siteSlug, pageRoute, sectionKey, readSection, stableFallback])

  return state
}
