/**
 * Database types für SEO Workflow Platform (Supabase/PostgreSQL).
 * Entspricht dem Schema aus supabase/migrations/001_initial_schema.sql
 */

export type ContentType = 'category' | 'blog'
export type ResultStatus = 'draft' | 'final'
export type ArtifactPhase = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'X'

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          project_id: string
          parent_id: string | null
          name: string
          type: ContentType
          hub_name: string | null
          zielgruppen: string[] | null
          shop_typ: string | null
          usps: string | null
          ton: string | null
          no_gos: string | null
          custom_placeholders: Record<string, string> | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          parent_id?: string | null
          name: string
          type?: ContentType
          hub_name?: string | null
          zielgruppen?: string[] | null
          shop_typ?: string | null
          usps?: string | null
          ton?: string | null
          no_gos?: string | null
          custom_placeholders?: Record<string, string> | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          parent_id?: string | null
          name?: string
          type?: ContentType
          hub_name?: string | null
          zielgruppen?: string[] | null
          shop_typ?: string | null
          usps?: string | null
          ton?: string | null
          no_gos?: string | null
          custom_placeholders?: Record<string, string> | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      artifacts: {
        Row: {
          id: string
          category_id: string
          phase: ArtifactPhase
          artifact_code: string
          name: string
          description: string | null
          prompt_template: string
          recommended_source: string | null
          estimated_duration_minutes: number | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          phase: ArtifactPhase
          artifact_code: string
          name: string
          description?: string | null
          prompt_template: string
          recommended_source?: string | null
          estimated_duration_minutes?: number | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          phase?: ArtifactPhase
          artifact_code?: string
          name?: string
          description?: string | null
          prompt_template?: string
          recommended_source?: string | null
          estimated_duration_minutes?: number | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      artifact_results: {
        Row: {
          id: string
          artifact_id: string
          result_text: string | null
          source: string | null
          version: number
          status: ResultStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artifact_id: string
          result_text?: string | null
          source?: string | null
          version?: number
          status?: ResultStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artifact_id?: string
          result_text?: string | null
          source?: string | null
          version?: number
          status?: ResultStatus
          created_at?: string
          updated_at?: string
        }
      }
      artifact_dependencies: {
        Row: {
          id: string
          artifact_id: string
          depends_on_artifact_id: string | null
          depends_on_phase: string | null
          placeholder_name: string
          created_at: string
        }
        Insert: {
          id?: string
          artifact_id: string
          depends_on_artifact_id?: string | null
          depends_on_phase?: string | null
          placeholder_name: string
          created_at?: string
        }
        Update: {
          id?: string
          artifact_id?: string
          depends_on_artifact_id?: string | null
          depends_on_phase?: string | null
          placeholder_name?: string
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          phase: string
          artifact_code: string | null
          prompt_template: string
          tags: string[] | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          phase: string
          artifact_code?: string | null
          prompt_template: string
          tags?: string[] | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          phase?: string
          artifact_code?: string | null
          prompt_template?: string
          tags?: string[] | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Convenience: Row-Typen pro Tabelle
export type ProjectRow = Database['public']['Tables']['projects']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type ArtifactRow = Database['public']['Tables']['artifacts']['Row']
export type ArtifactResultRow = Database['public']['Tables']['artifact_results']['Row']
export type ArtifactDependencyRow = Database['public']['Tables']['artifact_dependencies']['Row']
export type TemplateRow = Database['public']['Tables']['templates']['Row']

export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type ArtifactInsert = Database['public']['Tables']['artifacts']['Insert']
export type ArtifactResultInsert = Database['public']['Tables']['artifact_results']['Insert']
export type ArtifactDependencyInsert = Database['public']['Tables']['artifact_dependencies']['Insert']
export type TemplateInsert = Database['public']['Tables']['templates']['Insert']
