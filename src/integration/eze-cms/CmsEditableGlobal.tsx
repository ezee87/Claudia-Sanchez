import { cloneElement, type KeyboardEvent, type MouseEvent, type ReactElement } from 'react'
import type { CmsSiteConfig } from './cmsConfig'
import { previewIsAuthorized } from './CmsEditable'

type ElementProps = Record<string, unknown> & {
  onClick?: (event: MouseEvent<HTMLElement>) => void
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
  role?: string
  tabIndex?: number
}

type Props = {
  config: CmsSiteConfig
  groupKey: string
  fieldPath: string
  children: ReactElement<ElementProps>
}

export function CmsEditableGlobal({ config, groupKey, fieldPath, children }: Props) {
  if (!previewIsAuthorized(config)) return children
  const select = () => window.parent.postMessage({
    type: 'EZE_CMS_SELECT_GLOBAL', site: config.siteSlug, groupKey, fieldPath,
  }, config.cmsPreviewOrigin!)
  const onClick = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault(); event.stopPropagation(); select()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault(); event.stopPropagation(); select()
  }
  const interactive = typeof children.type === 'string'
    && ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(children.type)
  return cloneElement(children, {
    onClick, onKeyDown, tabIndex: children.props.tabIndex ?? 0,
    ...(!interactive && !children.props.role ? { role: 'button' } : {}),
    'data-eze-cms-global': `${groupKey}:${fieldPath}`,
  })
}
