import { cloneElement, type KeyboardEvent, type MouseEvent, type ReactElement } from 'react'
import type { CmsSiteConfig } from './cmsConfig'
import { authorizedPreviewOrigin } from './CmsEditable'
import { isCmsSectionHidden } from './cmsVisibility'

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
  collectionPath: string
  itemId?: string
  children: ReactElement<EditableElementProps>
}

const INTERACTIVE_SELECTOR = 'a,button,input,select,textarea,summary,details,[role="button"],[role="link"]'
// Los enlaces nunca navegan desde un elemento editable: el clic selecciona el elemento.
// Incluye tarjetas que son enlaces y enlaces estirados con ::after sobre toda la tarjeta.
const LINK_SELECTOR = 'a[href],area[href],[role="link"]'

/** Controles propios de la vista previa (botones, formularios, acordeones) que deben seguir funcionando. */
function isPreviewControl(target: Element, root: HTMLElement) {
  const link = target.closest(LINK_SELECTOR)
  if (link && (link === root || root.contains(link) || link.contains(root))) return false
  const interactive = target.closest(INTERACTIVE_SELECTOR)
  return Boolean(interactive && interactive !== root && root.contains(interactive))
}

function hasInteractiveSemantics(element: ReactElement<EditableElementProps>) {
  if (element.props.role) return true
  if (typeof element.type !== 'string') return false
  return ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(element.type)
}

export function CmsEditableCollection({ config, pageRoute, sectionKey, collectionPath, itemId, children }: Props) {
  // Una colección de una sección oculta no se muestra en ningún lugar, ni con su valor local.
  if (isCmsSectionHidden(config.siteSlug, pageRoute, sectionKey)) return null
  const targetOrigin = authorizedPreviewOrigin(config)
  if (!targetOrigin) return children

  const select = () => window.parent.postMessage({
    type: 'EZE_CMS_SELECT_COLLECTION',
    site: config.siteSlug,
    pageRoute,
    sectionKey,
    collectionPath,
    ...(itemId ? { itemId } : {}),
  }, targetOrigin)

  const onClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && isPreviewControl(event.target, event.currentTarget)) return
    event.preventDefault()
    event.stopPropagation()
    select()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    event.stopPropagation()
    select()
  }

  const previewProps: EditableElementProps = {
    onClick,
    onKeyDown,
    tabIndex: children.props.tabIndex ?? 0,
    'data-eze-cms-collection': collectionPath,
    ...(itemId ? { 'data-eze-cms-item-id': itemId } : {}),
  }
  if (!hasInteractiveSemantics(children)) previewProps.role = 'button'

  return cloneElement(children, previewProps)
}
