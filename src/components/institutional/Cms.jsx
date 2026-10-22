import { CmsEditable } from '../../integration/eze-cms/CmsEditable';
import { CmsEditableCollection } from '../../integration/eze-cms/CmsEditableCollection';
import { CmsEditableGlobal } from '../../integration/eze-cms/CmsEditableGlobal';
import { useCmsGlobal } from '../../integration/eze-cms/useCmsGlobal';
import { useCmsSection } from '../../integration/eze-cms/useCmsSection';
import { cmsRuntimeConfig, readCmsGlobal, readCmsSection } from '../../integration/eze-cms/cmsRuntime';
import { content, safeHref } from './content';
export function useSection(route, section) {
  return useCmsSection({config:cmsRuntimeConfig,pageRoute:route,sectionKey:section,fallback:content[route][section],readSection:readCmsSection});
}
export function useGlobal(groupKey, fallback) {
  return useCmsGlobal({config:cmsRuntimeConfig,groupKey,fallback,readGlobal:readCmsGlobal});
}
export function Field({route, section, path, children}) {
  return <CmsEditable config={cmsRuntimeConfig} pageRoute={route} sectionKey={section} fieldPath={path}>{children}</CmsEditable>;
}
export function Collection({route, section, path, itemId, children}) {
  return <CmsEditableCollection config={cmsRuntimeConfig} pageRoute={route} sectionKey={section} collectionPath={path} itemId={itemId}>{children}</CmsEditableCollection>;
}
export function GlobalField({groupKey, path, children}) {
  return <CmsEditableGlobal config={cmsRuntimeConfig} groupKey={groupKey} fieldPath={path}>{children}</CmsEditableGlobal>;
}
export function CmsLink({route,section,path,value,className}) {
  const fallback=content[route][section][path];
  return <Field route={route} section={section} path={path}><a className={className} href={safeHref(value?.href, fallback?.href || '/contacto')}>{value?.label || fallback?.label}</a></Field>;
}
export function CmsGlobalLink({groupKey,path,value,fallback,className}) {
  return <GlobalField groupKey={groupKey} path={path}><a className={className} href={safeHref(value?.href, fallback?.href || '/contacto')}>{value?.label || fallback?.label}</a></GlobalField>;
}
