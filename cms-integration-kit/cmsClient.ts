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
