import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CmsSiteConfig } from './cmsConfig'

export type CmsSectionRequest = {
  siteSlug: string
  pageRoute: string
  sectionKey: string
}

export type CmsSectionResult = {
  content: unknown | null
  error: Error | null
}

export type CmsSectionReader = (request: CmsSectionRequest) => Promise<CmsSectionResult>
export type CmsGlobalReader = (request: { siteSlug: string; groupKey: string }) => Promise<CmsSectionResult>

/** 'ruta::clave' → visible. Solo metadatos estructurales: nunca contenido. */
export type CmsSectionIndex = ReadonlyMap<string, boolean>
export type CmsSectionIndexResult = { index: CmsSectionIndex | null; error: Error | null }
export type CmsSectionIndexReader = (request: { siteSlug: string }) => Promise<CmsSectionIndexResult>

export type CmsArticle = {
  id: string
  site_id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  content: unknown
  published_at: string
  original_published_at: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

export type CmsArticlesResult = { articles: CmsArticle[]; error: Error | null }
export type CmsArticlesReader = (request: { siteSlug: string; articleSlug?: string }) => Promise<CmsArticlesResult>

export function createCmsClient(config: CmsSiteConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

type RpcReaderConfig = {
  /** Nombre exacto de la RPC pública ya desplegada. */
  functionName: string
  /** Traduce el contrato del kit a los argumentos reales de esa RPC. */
  buildArguments: (request: CmsSectionRequest) => Record<string, unknown>
  /** Extrae `sections.content` de la respuesta real, sin imponer otra forma. */
  extractContent: (data: unknown) => unknown | null
}

export function createRpcSectionReader(client: SupabaseClient, config: RpcReaderConfig): CmsSectionReader {
  return async (request) => {
    try {
      const { data, error } = await client.rpc(config.functionName, config.buildArguments(request))
      if (error) return { content: null, error: new Error(error.message) }
      return { content: config.extractContent(data), error: null }
    } catch (error) {
      return { content: null, error: error instanceof Error ? error : new Error('No se pudo leer la sección.') }
    }
  }
}

export function createPublicSectionReader(client: SupabaseClient): CmsSectionReader {
  return createRpcSectionReader(client, {
    functionName: 'get_public_section',
    buildArguments: (request) => ({
      site_slug: request.siteSlug,
      page_route: request.pageRoute,
      section_key: request.sectionKey,
    }),
    extractContent: (data) => {
      if (!Array.isArray(data) || data.length === 0) return null
      const firstRow: unknown = data[0]
      if (firstRow === null || typeof firstRow !== 'object' || Array.isArray(firstRow)) return null
      return Object.prototype.hasOwnProperty.call(firstRow, 'content')
        ? (firstRow as { content: unknown }).content
        : null
    },
  })
}

export function createPublicGlobalReader(client: SupabaseClient): CmsGlobalReader {
  return async ({ siteSlug, groupKey }) => {
    try {
      const { data, error } = await client.rpc('get_public_site_global', { site_slug: siteSlug, global_key: groupKey })
      if (error) return { content: null, error: new Error(error.message) }
      if (!Array.isArray(data) || data.length === 0) return { content: null, error: null }
      const row = data[0]
      return row !== null && typeof row === 'object' && !Array.isArray(row) && Object.prototype.hasOwnProperty.call(row, 'content')
        ? { content: (row as { content: unknown }).content, error: null }
        : { content: null, error: null }
    } catch (error) {
      return { content: null, error: error instanceof Error ? error : new Error('No se pudo leer el contenido global.') }
    }
  }
}

/**
 * Misma regla que `parseSectionIndex` de scripts/cms-snapshot-plugin.mjs: solo `visible === true` es visible; false, null o
 * cualquier otro valor cuenta como oculta. Una respuesta mal formada es un error, nunca una sección oculta.
 */
export function parseSectionIndex(data: unknown): CmsSectionIndex {
  if (!Array.isArray(data)) throw new Error('el índice de secciones no es una lista')
  const index = new Map<string, boolean>()
  for (const row of data as unknown[]) {
    const entry = row as { page_route?: unknown; section_key?: unknown; visible?: unknown } | null
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry) || typeof entry.page_route !== 'string' || typeof entry.section_key !== 'string') {
      throw new Error('fila del índice de secciones no válida')
    }
    const id = `${entry.page_route}::${entry.section_key}`
    if (index.has(id)) throw new Error(`el índice de secciones repite ${id}`)
    index.set(id, entry.visible === true)
  }
  return index
}

export function createPublicSectionIndexReader(client: SupabaseClient): CmsSectionIndexReader {
  return async ({ siteSlug }) => {
    try {
      const { data, error } = await client.rpc('get_public_section_index', { site_slug: siteSlug })
      if (error) return { index: null, error: new Error(error.message) }
      return { index: parseSectionIndex(data), error: null }
    } catch (error) {
      return { index: null, error: error instanceof Error ? error : new Error('No se pudo leer el índice de secciones.') }
    }
  }
}

/** Reads only public, published articles through the CMS RPC. */
export function createPublicArticlesReader(client: SupabaseClient): CmsArticlesReader {
  return async ({ siteSlug, articleSlug }) => {
    try {
      const { data, error } = await client.rpc('get_published_articles', {
        p_site_slug: siteSlug,
        p_article_slug: articleSlug ?? null,
      })
      if (error) return { articles: [], error: new Error(error.message) }
      return { articles: Array.isArray(data) ? data as CmsArticle[] : [], error: null }
    } catch (error) {
      return { articles: [], error: error instanceof Error ? error : new Error('No se pudieron leer los artículos.') }
    }
  }
}
