import { useEffect, useMemo, useState } from 'react'
import type { CmsGlobalReader } from './cmsClient'
import type { CmsSiteConfig } from './cmsConfig'
import { authorizedPreviewOrigin } from './CmsEditable'
import { cmsLocalOnly } from './cmsMode'
import { snapshotGlobal } from './cmsSnapshot'
import { applyRemoteContent, initialCmsState, mergeCmsContent, type CmsSectionState } from './useCmsSection'

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
  const localOnly = cmsLocalOnly
  const initial = useMemo(
    () => initialCmsState(stableFallback, snapshotGlobal(config.siteSlug, groupKey), localOnly),
    [config.siteSlug, groupKey, localOnly, stableFallback],
  )
  const [state, setState] = useState<CmsSectionState<T>>(initial)

  useEffect(() => {
    if (localOnly) {
      setState({ content: stableFallback, loading: false, error: null, source: 'local' })
      return undefined
    }

    let active = true
    let receivedUpdate = false
    const receive = (event: MessageEvent) => {
      if (!active || event.source !== window.parent || event.origin !== authorizedPreviewOrigin(config)) return
      const message = event.data
      if (!message || typeof message !== 'object' || message.type !== 'EZE_CMS_UPDATE_GLOBAL') return
      if (message.site !== config.siteSlug || message.groupKey !== groupKey || !isObject(message.content)) return
      receivedUpdate = true
      setState({ content: mergeCmsContent(stableFallback, message.content), loading: false, error: null, source: 'remote' })
    }
    window.addEventListener('message', receive)
    setState(initial)
    void readGlobal({ siteSlug: config.siteSlug, groupKey }).then((result) => {
      if (!active || receivedUpdate) return
      if (result.error || !isObject(result.content)) {
        setState({ ...initial, loading: false, error: result.error }); return
      }
      const remote = mergeCmsContent(stableFallback, result.content)
      setState((previous) => applyRemoteContent(previous, remote))
    }).catch((error: unknown) => {
      if (active && !receivedUpdate) setState({ ...initial, loading: false, error: error instanceof Error ? error : new Error('No se pudo cargar el contenido global.') })
    })
    return () => { active = false; window.removeEventListener('message', receive) }
  }, [config.siteSlug, groupKey, initial, localOnly, readGlobal, stableFallback])

  return state
}
