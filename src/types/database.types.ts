// @ts-nocheck

export type ArtifactPhase = string
export type ContentType = string
export type ResultStatus = string

export type ProjectRow = Record<string, any>
export type CategoryRow = Record<string, any>
export type ArtifactRow = Record<string, any>
export type ArtifactInsert = Record<string, any>
export type ArtifactResultRow = Record<string, any>
export type TemplateRow = Record<string, any>
export type PhaseOutputTemplateRow = Record<string, any>
export type CategoryPhaseOutputRow = Record<string, any>
export type CategoryReferenceDocRow = Record<string, any>
export type Database = Record<string, any>

// ─── Link Graph ────────────────────────────────────────────────────────────────

export type PageType = 'hub' | 'spoke' | 'blog'
export type PageStatus = 'published' | 'draft' | 'planned'

export interface PageRow {
  id: string
  project_id: string
  category_id: string | null
  name: string
  type: PageType
  status: PageStatus
  url_slug: string | null
  markdown_file_path: string | null
  word_count: number
  position_x: number | null
  position_y: number | null
  created_at: string
  updated_at: string
}

export interface PageInsert {
  project_id: string
  category_id?: string | null
  name: string
  type: PageType
  status?: PageStatus
  url_slug?: string | null
  markdown_file_path?: string | null
  word_count?: number
  position_x?: number | null
  position_y?: number | null
}

export interface PageUpdate {
  category_id?: string | null
  name?: string
  type?: PageType
  status?: PageStatus
  url_slug?: string | null
  markdown_file_path?: string | null
  word_count?: number
  position_x?: number | null
  position_y?: number | null
}

export interface PageLinkRow {
  id: string
  project_id: string
  from_page_id: string
  to_page_id: string
  anchor_text: string | null
  context_sentence: string | null
  placement: string | null
  line_number_start: number | null
  line_number_end: number | null
  created_at: string
  updated_at: string
}

export interface PageLinkInsert {
  project_id: string
  from_page_id: string
  to_page_id: string
  anchor_text?: string | null
  context_sentence?: string | null
  placement?: string | null
  line_number_start?: number | null
  line_number_end?: number | null
}

export interface PageLinkUpdate {
  anchor_text?: string | null
  context_sentence?: string | null
  placement?: string | null
  line_number_start?: number | null
  line_number_end?: number | null
}