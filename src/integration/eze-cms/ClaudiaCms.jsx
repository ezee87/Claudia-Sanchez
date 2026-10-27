import { useMemo } from 'react';
import { CmsEditable } from './CmsEditable';
import { CmsEditableCollection } from './CmsEditableCollection';
import { cmsRuntimeConfig, readCmsSection } from './cmsRuntime';
import { useCmsSection } from './useCmsSection';

export const CLAUDIA_PAGE_ROUTE = '/diseno-de-carrera';

function publicName(value) {
  if (typeof value === 'string') return value.replace(/Claudia (?:Sánchez|Sanchez)(?! Urencio)/g, 'Claudia Sánchez Urencio').replace(/CLAUDIA SÁNCHEZ/g, 'Claudia Sánchez Urencio');
  if (Array.isArray(value)) return value.map(publicName);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,entry])=>[key,publicName(entry)]));
  return value;
}

export function useClaudiaCmsSection(sectionKey, fallback) {
  const state = useCmsSection({
    config: cmsRuntimeConfig,
    pageRoute: CLAUDIA_PAGE_ROUTE,
    sectionKey,
    fallback,
    readSection: readCmsSection,
  });
  const content = useMemo(() => publicName(state.content), [state.content]);
  return { ...state, content };
}

export function ClaudiaEditable({ sectionKey, fieldPath, children }) {
  return (
    <CmsEditable
      config={cmsRuntimeConfig}
      pageRoute={CLAUDIA_PAGE_ROUTE}
      sectionKey={sectionKey}
      fieldPath={fieldPath}
    >
      {children}
    </CmsEditable>
  );
}

export function ClaudiaEditableCollection({ sectionKey, collectionPath, itemId, children }) {
  return (
    <CmsEditableCollection
      config={cmsRuntimeConfig}
      pageRoute={CLAUDIA_PAGE_ROUTE}
      sectionKey={sectionKey}
      collectionPath={collectionPath}
      itemId={itemId}
    >
      {children}
    </CmsEditableCollection>
  );
}
