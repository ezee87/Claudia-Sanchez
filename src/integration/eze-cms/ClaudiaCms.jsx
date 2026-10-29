import { useMemo } from 'react';
import { LANDING_ROUTE } from '../../data/claudia/landingCms.js';
import { CmsEditable } from './CmsEditable';
import { CmsEditableCollection } from './CmsEditableCollection';
import { CmsSection } from './CmsSection';
import { cmsRuntimeConfig, readCmsSection } from './cmsRuntime';
import { useCmsHiddenSections } from './cmsVisibility';
import { useCmsSection } from './useCmsSection';

export const CLAUDIA_PAGE_ROUTE = LANDING_ROUTE;

/** Bloque de la landing que se desmonta si su sección está oculta en Eze CMS. */
export function ClaudiaSection({ sectionKey, children }) {
  return <CmsSection config={cmsRuntimeConfig} pageRoute={CLAUDIA_PAGE_ROUTE} sectionKey={sectionKey}>{children}</CmsSection>;
}

/** Claves de la landing ocultas en Eze CMS (para no enlazar anclas de secciones que no se muestran). */
export function useClaudiaHiddenSections() {
  const hidden = useCmsHiddenSections(cmsRuntimeConfig.siteSlug);
  return useMemo(() => new Set([...hidden].filter((id) => id.startsWith(`${CLAUDIA_PAGE_ROUTE}::`)).map((id) => id.slice(CLAUDIA_PAGE_ROUTE.length + 2))), [hidden]);
}

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
