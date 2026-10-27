import { cloneElement, type KeyboardEvent, type MouseEvent, type ReactElement } from 'react'
import type { CmsSiteConfig } from './cmsConfig'

type EditableElementProps = Record<string, unknown> & {
  onClick?: (event: MouseEvent<HTMLElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
  role?: string
  tabIndex?: number
}

type Props = {
  config: CmsSiteConfig
  pageRoute: string
  sectionKey: string
  fieldPath: string
  children: ReactElement<EditableElementProps>
}

/**
 * Origen exacto del CMS que embebe la página, o null. Exige iframe, `?cmsPreview=true` y un referrer cuyo origen
 * figure en la lista autorizada; ese mismo origen es el único `targetOrigin` y `event.origin` aceptados.
 */
export function authorizedPreviewOrigin(config: CmsSiteConfig): string | null {
  const allowed = [...(config.cmsPreviewOrigins ?? []), ...(config.cmsPreviewOrigin ? [config.cmsPreviewOrigin] : [])]
  if (typeof window === 'undefined' || window.parent === window || !allowed.length) return null
  if (new URLSearchParams(window.location.search).get('cmsPreview') !== 'true') return null
  if (!document.referrer) return null
  try {
    const origin = new URL(document.referrer).origin
    return allowed.includes(origin) ? origin : null
  } catch { return null }
}

export function previewIsAuthorized(config: CmsSiteConfig) {
  return authorizedPreviewOrigin(config) !== null
}

function hasInteractiveSemantics(element: ReactElement<EditableElementProps>) {
  if (element.props.role) return true
  if (typeof element.type !== 'string') return false
  return ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(element.type)
}

export function CmsEditable({ config, pageRoute, sectionKey, fieldPath, children }: Props) {
  const targetOrigin = authorizedPreviewOrigin(config)
  if (!targetOrigin) return children

  const select = () => window.parent.postMessage({
    type: 'EZE_CMS_SELECT_FIELD',
    site: config.siteSlug,
    pageRoute,
    sectionKey,
    fieldPath,
  }, targetOrigin)

  const onClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    select()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopPropagation()
    select()
  }

  const previewProps: EditableElementProps = {
    onClick,
    onKeyDown,
    tabIndex: children.props.tabIndex ?? 0,
    'data-eze-cms-editable': fieldPath,
  }
  if (!hasInteractiveSemantics(children)) previewProps.role = 'button'

  return cloneElement(children, previewProps)
}
