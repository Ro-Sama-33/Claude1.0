/**
 * Database-types voor Supabase.
 *
 * Voorlopig met de hand bijgehouden, in sync met supabase/migrations/.
 * Zodra het Supabase-project gekoppeld is vervang je dit bestand met:
 *   supabase gen types typescript --project-id <ref> > src/lib/types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          city: string | null;
          current_role: string | null;
          salary_indication: string | null;
          hours_per_week: number | null;
          contract_preference: string | null;
          availability: string | null;
          source: string | null;
          cv_path: string | null;
          last_contact_at: string | null;
          status: Database["public"]["Enums"]["candidate_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          city?: string | null;
          current_role?: string | null;
          salary_indication?: string | null;
          hours_per_week?: number | null;
          contract_preference?: string | null;
          availability?: string | null;
          source?: string | null;
          cv_path?: string | null;
          last_contact_at?: string | null;
          status?: Database["public"]["Enums"]["candidate_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          city?: string | null;
          current_role?: string | null;
          salary_indication?: string | null;
          hours_per_week?: number | null;
          contract_preference?: string | null;
          availability?: string | null;
          source?: string | null;
          cv_path?: string | null;
          last_contact_at?: string | null;
          status?: Database["public"]["Enums"]["candidate_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      candidate_notes: {
        Row: {
          id: string;
          candidate_id: string;
          body: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          body: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          body?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidate_notes_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "candidate_notes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      consents: {
        Row: {
          id: string;
          candidate_id: string;
          granted_at: string;
          expires_at: string;
          method: string;
          status: Database["public"]["Enums"]["consent_status"];
          reminder_sent_at: string | null;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          granted_at?: string;
          method: string;
          status?: Database["public"]["Enums"]["consent_status"];
          reminder_sent_at?: string | null;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          granted_at?: string;
          method?: string;
          status?: Database["public"]["Enums"]["consent_status"];
          reminder_sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consents_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      candidate_status: "actief" | "gearchiveerd" | "geanonimiseerd";
      consent_status: "actief" | "verloopt_binnenkort" | "verlopen";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Candidate = Database["public"]["Tables"]["candidates"]["Row"];
export type CandidateNote =
  Database["public"]["Tables"]["candidate_notes"]["Row"];
export type Consent = Database["public"]["Tables"]["consents"]["Row"];
export type CandidateStatus =
  Database["public"]["Enums"]["candidate_status"];
