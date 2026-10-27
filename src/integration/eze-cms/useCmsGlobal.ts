import { useEffect, useMemo, useState } from 'react'
import type { CmsGlobalReader } from './cmsClient'
import type { CmsSiteConfig } from './cmsConfig'
import { previewIsAuthorized } from './CmsEditable'
import { mergeCmsContent, type CmsSectionState } from './useCmsSection'

type JsonObject = Record<string, unknown>
type Options<T extends JsonObject> = {
  config: CmsSiteConfig
  groupKey: string
  fallback: T
  readGlobal: CmsGlobalReader
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function useCmsGlobal<T extends JsonObject>({ config, groupKey, fallback, readGlobal }: Options<T>): CmsSectionState<T> {
  const signature = JSON.stringify(fallback)
  const stableFallback = useMemo(() => fallback, [signature]) // eslint-disable-line react-hooks/exhaustive-deps
  const localOnly = import.meta.env.DEV
  const [state, setState] = useState<CmsSectionState<T>>({ content: stableFallback, loading: !localOnly, error: null, source: 'local' })

  useEffect(() => {
    if (localOnly) {
      setState({ content: stableFallback, loading: false, error: null, source: 'local' })
      return undefined
    }

    let active = true
    let receivedUpdate = false
    const receive = (event: MessageEvent) => {
      if (!active || !previewIsAuthorized(config) || event.source !== window.parent || event.origin !== config.cmsPreviewOrigin) return
      const message = event.data
      if (!message || typeof message !== 'object' || message.type !== 'EZE_CMS_UPDATE_GLOBAL') return
      if (message.site !== config.siteSlug || message.groupKey !== groupKey || !isObject(message.content)) return
      receivedUpdate = true
      setState({ content: mergeCmsContent(stableFallback, message.content), loading: false, error: null, source: 'remote' })
    }
    window.addEventListener('message', receive)
    setState({ content: stableFallback, loading: true, error: null, source: 'local' })
    void readGlobal({ siteSlug: config.siteSlug, groupKey }).then((result) => {
      if (!active || receivedUpdate) return
      if (result.error || !isObject(result.content)) {
        setState({ content: stableFallback, loading: false, error: result.error, source: 'local' }); return
      }
      setState({ content: mergeCmsContent(stableFallback, result.content), loading: false, error: null, source: 'remote' })
    }).catch((error: unknown) => {
      if (active && !receivedUpdate) setState({ content: stableFallback, loading: false, error: error instanceof Error ? error : new Error('No se pudo cargar el contenido global.'), source: 'local' })
    })
    return () => { active = false; window.removeEventListener('message', receive) }
  }, [config.siteSlug, groupKey, localOnly, readGlobal, stableFallback])

  return state
}
