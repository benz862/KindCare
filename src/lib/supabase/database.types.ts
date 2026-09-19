export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointment_preparations: {
        Row: {
          documents_to_bring: string | null
          event_id: string
          follow_up_tasks: string | null
          household_id: string
          patient_id: string
          questions: string | null
          transport_plan: string | null
          updated_at: string
        }
        Insert: {
          documents_to_bring?: string | null
          event_id: string
          follow_up_tasks?: string | null
          household_id: string
          patient_id: string
          questions?: string | null
          transport_plan?: string | null
          updated_at?: string
        }
        Update: {
          documents_to_bring?: string | null
          event_id?: string
          follow_up_tasks?: string | null
          household_id?: string
          patient_id?: string
          questions?: string | null
          transport_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_preparations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_preparations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_preparations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          event_type: string
          household_id: string | null
          id: string
          metadata: Json
          outcome: string
          patient_id: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          event_type: string
          household_id?: string | null
          id?: string
          metadata?: Json
          outcome: string
          patient_id?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          event_type?: string
          household_id?: string | null
          id?: string
          metadata?: Json
          outcome?: string
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          assigned_to: string | null
          created_at: string
          created_by: string
          ends_at: string | null
          household_id: string
          id: string
          kind: string
          notes: string | null
          patient_id: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          assigned_to?: string | null
          created_at?: string
          created_by: string
          ends_at?: string | null
          household_id: string
          id?: string
          kind: string
          notes?: string | null
          patient_id: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string | null
          household_id?: string
          id?: string
          kind?: string
          notes?: string | null
          patient_id?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_messages: {
        Row: {
          caregiver_summary: string | null
          content: string
          created_at: string
          household_id: string
          id: string
          member_profile_id: string
          needs_attention: boolean
          patient_id: string
          role: string
        }
        Insert: {
          caregiver_summary?: string | null
          content: string
          created_at?: string
          household_id: string
          id?: string
          member_profile_id: string
          needs_attention?: boolean
          patient_id: string
          role: string
        }
        Update: {
          caregiver_summary?: string | null
          content?: string
          created_at?: string
          household_id?: string
          id?: string
          member_profile_id?: string
          needs_attention?: boolean
          patient_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_messages_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_messages_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          choice: string
          created_at: string
          household_id: string
          id: string
          member_profile_id: string
          patient_id: string | null
          recorded_by: string
        }
        Insert: {
          choice: string
          created_at?: string
          household_id: string
          id?: string
          member_profile_id: string
          patient_id?: string | null
          recorded_by: string
        }
        Update: {
          choice?: string
          created_at?: string
          household_id?: string
          id?: string
          member_profile_id?: string
          patient_id?: string | null
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          created_by: string
          household_id: string
          id: string
          include_in_talk: boolean
          is_emergency: boolean
          name: string
          patient_id: string
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          include_in_talk?: boolean
          is_emergency?: boolean
          name: string
          patient_id: string
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          include_in_talk?: boolean
          is_emergency?: boolean
          name?: string
          patient_id?: string
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      handoff_acks: {
        Row: {
          handoff_id: string
          household_id: string
          patient_id: string
          profile_id: string
          read_at: string
        }
        Insert: {
          handoff_id: string
          household_id: string
          patient_id: string
          profile_id: string
          read_at?: string
        }
        Update: {
          handoff_id?: string
          household_id?: string
          patient_id?: string
          profile_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_acks_handoff_id_fkey"
            columns: ["handoff_id"]
            isOneToOne: false
            referencedRelation: "handoffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_acks_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_acks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_acks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      handoff_assignments: {
        Row: {
          assigned_to: string | null
          created_at: string
          done: boolean
          done_at: string | null
          done_by: string | null
          handoff_id: string
          household_id: string
          id: string
          patient_id: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          handoff_id: string
          household_id: string
          id?: string
          patient_id: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          handoff_id?: string
          household_id?: string
          id?: string
          patient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_assignments_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_assignments_handoff_id_fkey"
            columns: ["handoff_id"]
            isOneToOne: false
            referencedRelation: "handoffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_assignments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      handoffs: {
        Row: {
          author_id: string
          body: string
          created_at: string
          household_id: string
          id: string
          patient_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          household_id: string
          id?: string
          patient_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          household_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoffs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoffs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoffs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      help_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          household_id: string
          id: string
          member_profile_id: string
          patient_id: string
          status: string
          summary: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          household_id: string
          id?: string
          member_profile_id: string
          patient_id: string
          status?: string
          summary?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          household_id?: string
          id?: string
          member_profile_id?: string
          patient_id?: string
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_alerts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_alerts_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          profile_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          profile_id: string
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          profile_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          help_confirm_required: boolean
          id: string
          name: string
          supported_person_name: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          help_confirm_required?: boolean
          id?: string
          name: string
          supported_person_name?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          help_confirm_required?: boolean
          id?: string
          name?: string
          supported_person_name?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      in_app_notifications: {
        Row: {
          body: string
          created_at: string
          household_id: string
          href: string | null
          id: string
          kind: string
          profile_id: string
          read_at: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          household_id: string
          href?: string | null
          id?: string
          kind: string
          profile_id: string
          read_at?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          household_id?: string
          href?: string | null
          id?: string
          kind?: string
          profile_id?: string
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "in_app_notifications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "in_app_notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          household_id: string
          id: string
          invited_by: string
          patient_id: string | null
          revoked_at: string | null
          role: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          household_id: string
          id?: string
          invited_by: string
          patient_id?: string | null
          revoked_at?: string | null
          role: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          household_id?: string
          id?: string
          invited_by?: string
          patient_id?: string | null
          revoked_at?: string | null
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_doses: {
        Row: {
          caregiver_note: string | null
          created_at: string
          due_at: string
          household_id: string
          id: string
          marked_at: string | null
          marked_by: string | null
          member_profile_id: string
          patient_id: string
          plan_id: string
          status: string
        }
        Insert: {
          caregiver_note?: string | null
          created_at?: string
          due_at: string
          household_id: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          member_profile_id: string
          patient_id: string
          plan_id: string
          status?: string
        }
        Update: {
          caregiver_note?: string | null
          created_at?: string
          due_at?: string
          household_id?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          member_profile_id?: string
          patient_id?: string
          plan_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_doses_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_doses_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_doses_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_doses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_doses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "medication_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_plans: {
        Row: {
          active: boolean
          amount_text: string
          created_at: string
          created_by: string
          days_of_week: number[] | null
          end_on: string | null
          household_id: string
          id: string
          member_profile_id: string
          name: string
          notify_organizer: boolean
          patient_id: string
          refill_note: string | null
          reminder_text: string | null
          start_on: string
          strength_label: string
          times: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount_text: string
          created_at?: string
          created_by: string
          days_of_week?: number[] | null
          end_on?: string | null
          household_id: string
          id?: string
          member_profile_id: string
          name: string
          notify_organizer?: boolean
          patient_id: string
          refill_note?: string | null
          reminder_text?: string | null
          start_on: string
          strength_label: string
          times: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount_text?: string
          created_at?: string
          created_by?: string
          days_of_week?: number[] | null
          end_on?: string | null
          household_id?: string
          id?: string
          member_profile_id?: string
          name?: string
          notify_organizer?: boolean
          patient_id?: string
          refill_note?: string | null
          reminder_text?: string | null
          start_on?: string
          strength_label?: string
          times?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_plans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_plans_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      member_requests: {
        Row: {
          created_at: string
          household_id: string
          id: string
          kind: string
          label: string | null
          member_profile_id: string
          message: string | null
          patient_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          kind: string
          label?: string | null
          member_profile_id: string
          message?: string | null
          patient_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          kind?: string
          label?: string | null
          member_profile_id?: string
          message?: string | null
          patient_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_requests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_requests_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          household_id: string
          id: string
          patient_id: string
          photo_path: string | null
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          household_id: string
          id?: string
          patient_id: string
          photo_path?: string | null
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          household_id?: string
          id?: string
          patient_id?: string
          photo_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_assignments: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          profile_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          profile_id: string
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          profile_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_setup_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          patient_id: string
          phone: string | null
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          invited_by: string
          patient_id: string
          phone?: string | null
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          patient_id?: string
          phone?: string | null
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_setup_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_setup_invites_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          created_at: string
          created_by: string
          display_name: string
          help_confirm_required: boolean
          household_id: string
          id: string
          member_profile_id: string | null
          phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          display_name: string
          help_confirm_required?: boolean
          household_id: string
          id?: string
          member_profile_id?: string | null
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          display_name?: string
          help_confirm_required?: boolean
          household_id?: string
          id?: string
          member_profile_id?: string | null
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          notify_email: boolean
          notify_in_app: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          notify_email?: boolean
          notify_in_app?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          notify_email?: boolean
          notify_in_app?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      request_presets: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          household_id: string
          id: string
          kind: string
          label: string
          patient_id: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          household_id: string
          id?: string
          kind: string
          label: string
          patient_id: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          household_id?: string
          id?: string
          kind?: string
          label?: string
          patient_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "request_presets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_presets_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_presets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_occurrences: {
        Row: {
          assigned_to: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_at: string
          household_id: string
          id: string
          note: string | null
          patient_id: string
          routine_id: string
          status: string
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_at: string
          household_id: string
          id?: string
          note?: string | null
          patient_id: string
          routine_id: string
          status?: string
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_at?: string
          household_id?: string
          id?: string
          note?: string | null
          patient_id?: string
          routine_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_occurrences_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_occurrences_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_occurrences_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_occurrences_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_occurrences_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          active: boolean
          assigned_to: string
          created_at: string
          created_by: string
          days_of_week: number[] | null
          end_on: string | null
          follow_up: string
          household_id: string
          id: string
          kind: string
          local_time: string
          notes: string | null
          patient_id: string
          recurrence: string
          start_on: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          assigned_to: string
          created_at?: string
          created_by: string
          days_of_week?: number[] | null
          end_on?: string | null
          follow_up?: string
          household_id: string
          id?: string
          kind: string
          local_time: string
          notes?: string | null
          patient_id: string
          recurrence?: string
          start_on: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          assigned_to?: string
          created_at?: string
          created_by?: string
          days_of_week?: number[] | null
          end_on?: string | null
          follow_up?: string
          household_id?: string
          id?: string
          kind?: string
          local_time?: string
          notes?: string | null
          patient_id?: string
          recurrence?: string
          start_on?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routines_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_deliveries: {
        Row: {
          created_at: string
          deliver_at: string
          delivered_at: string | null
          household_id: string
          id: string
          listened_at: string | null
          patient_id: string
          recurrence: string
          status: string
          voice_note_id: string
        }
        Insert: {
          created_at?: string
          deliver_at: string
          delivered_at?: string | null
          household_id: string
          id?: string
          listened_at?: string | null
          patient_id: string
          recurrence?: string
          status?: string
          voice_note_id: string
        }
        Update: {
          created_at?: string
          deliver_at?: string
          delivered_at?: string | null
          household_id?: string
          id?: string
          listened_at?: string | null
          patient_id?: string
          recurrence?: string
          status?: string
          voice_note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_deliveries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_deliveries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_deliveries_voice_note_id_fkey"
            columns: ["voice_note_id"]
            isOneToOne: false
            referencedRelation: "voice_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          livemode: boolean | null
          stripe_object_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id: string
          livemode?: boolean | null
          stripe_object_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          livemode?: boolean | null
          stripe_object_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          household_id: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          household_id: string
          id?: string
          status: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          household_id?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_notes: {
        Row: {
          author_id: string
          body_text: string | null
          created_at: string
          duration_seconds: number | null
          household_id: string
          id: string
          patient_id: string
          recipient_id: string
          storage_path: string | null
          title: string | null
        }
        Insert: {
          author_id: string
          body_text?: string | null
          created_at?: string
          duration_seconds?: number | null
          household_id: string
          id?: string
          patient_id: string
          recipient_id: string
          storage_path?: string | null
          title?: string | null
        }
        Update: {
          author_id?: string
          body_text?: string | null
          created_at?: string
          duration_seconds?: number | null
          household_id?: string
          id?: string
          patient_id?: string
          recipient_id?: string
          storage_path?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wellbeing_checkins: {
        Row: {
          created_at: string
          feeling: string
          household_id: string
          id: string
          member_profile_id: string
          note: string | null
          patient_id: string
        }
        Insert: {
          created_at?: string
          feeling: string
          household_id: string
          id?: string
          member_profile_id: string
          note?: string | null
          patient_id: string
        }
        Update: {
          created_at?: string
          feeling?: string
          household_id?: string
          id?: string
          member_profile_id?: string
          note?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellbeing_checkins_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellbeing_checkins_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellbeing_checkins_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      accept_patient_setup: { Args: { p_token: string }; Returns: string }
      create_invitation: {
        Args: {
          p_email: string
          p_household_id: string
          p_patient_id?: string
          p_role: string
        }
        Returns: string
      }
      create_patient: {
        Args: {
          p_display_name: string
          p_household_id: string
          p_phone?: string
        }
        Returns: string
      }
      create_patient_setup_invite: {
        Args: { p_patient_id: string; p_phone?: string }
        Returns: string
      }
      deliver_due_voice_notes: { Args: never; Returns: number }
      invitation_preview: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          household_name: string
          role: string
        }[]
      }
      materialize_plan_items: { Args: never; Returns: number }
      preview_patient_setup: {
        Args: { p_token: string }
        Returns: {
          already_linked: boolean
          caregiver_display_name: string
          expires_at: string
          patient_display_name: string
          patient_id: string
        }[]
      }
      revoke_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      revoke_patient_setup_invite: {
        Args: { p_invite_id: string }
        Returns: undefined
      }
      set_patient_backup_primary: {
        Args: { p_patient_id: string; p_profile_id: string }
        Returns: undefined
      }
      update_help_action: {
        Args: { p_confirm_required: boolean; p_household_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
