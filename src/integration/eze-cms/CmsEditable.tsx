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

export function previewIsAuthorized(config: CmsSiteConfig) {
  if (typeof window === 'undefined' || window.parent === window || !config.cmsPreviewOrigin) return false
  if (new URLSearchParams(window.location.search).get('cmsPreview') !== 'true') return false
  if (!document.referrer) return false
  try { return new URL(document.referrer).origin === config.cmsPreviewOrigin }
  catch { return false }
}

function hasInteractiveSemantics(element: ReactElement<EditableElementProps>) {
  if (element.props.role) return true
  if (typeof element.type !== 'string') return false
  return ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(element.type)
}

export function CmsEditable({ config, pageRoute, sectionKey, fieldPath, children }: Props) {
  if (!previewIsAuthorized(config)) return children

  const select = () => window.parent.postMessage({
    type: 'EZE_CMS_SELECT_FIELD',
    site: config.siteSlug,
    pageRoute,
    sectionKey,
    fieldPath,
  }, config.cmsPreviewOrigin!)

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
