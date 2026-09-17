export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_events: {
        Row: {
          actor_profile_id: string | null;
          created_at: string;
          event_type: string;
          household_id: string | null;
          id: string;
          metadata: Json;
          outcome: string;
        };
        Insert: {
          actor_profile_id?: string | null;
          created_at?: string;
          event_type: string;
          household_id?: string | null;
          id?: string;
          metadata?: Json;
          outcome: string;
        };
        Update: {
          actor_profile_id?: string | null;
          created_at?: string;
          event_type?: string;
          household_id?: string | null;
          id?: string;
          metadata?: Json;
          outcome?: string;
        };
        Relationships: [];
      };
      consent_records: {
        Row: {
          choice: string;
          created_at: string;
          household_id: string;
          id: string;
          member_profile_id: string;
          recorded_by: string;
        };
        Insert: {
          choice: string;
          created_at?: string;
          household_id: string;
          id?: string;
          member_profile_id: string;
          recorded_by: string;
        };
        Update: {
          choice?: string;
          created_at?: string;
          household_id?: string;
          id?: string;
          member_profile_id?: string;
          recorded_by?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string;
          created_by: string;
          household_id: string;
          id: string;
          include_in_talk: boolean;
          is_emergency: boolean;
          name: string;
          phone: string | null;
          relationship: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          household_id: string;
          id?: string;
          include_in_talk?: boolean;
          is_emergency?: boolean;
          name: string;
          phone?: string | null;
          relationship?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          household_id?: string;
          id?: string;
          include_in_talk?: boolean;
          is_emergency?: boolean;
          name?: string;
          phone?: string | null;
          relationship?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      help_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          created_at: string;
          household_id: string;
          id: string;
          member_profile_id: string;
          status: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          household_id: string;
          id?: string;
          member_profile_id: string;
          status?: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          created_at?: string;
          household_id?: string;
          id?: string;
          member_profile_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          created_at: string;
          household_id: string;
          id: string;
          profile_id: string;
          role: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          id?: string;
          profile_id: string;
          role: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          id?: string;
          profile_id?: string;
          role?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      households: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          supported_person_name: string | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          supported_person_name?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          supported_person_name?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          household_id: string;
          id: string;
          invited_by: string;
          revoked_at: string | null;
          role: string;
          token_hash: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          household_id: string;
          id?: string;
          invited_by: string;
          revoked_at?: string | null;
          role: string;
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          household_id?: string;
          id?: string;
          invited_by?: string;
          revoked_at?: string | null;
          role?: string;
          token_hash?: string;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          all_day: boolean;
          assigned_to: string | null;
          created_at: string;
          created_by: string;
          ends_at: string | null;
          household_id: string;
          id: string;
          kind: string;
          notes: string | null;
          starts_at: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          all_day?: boolean;
          assigned_to?: string | null;
          created_at?: string;
          created_by: string;
          ends_at?: string | null;
          household_id: string;
          id?: string;
          kind: string;
          notes?: string | null;
          starts_at: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          all_day?: boolean;
          assigned_to?: string | null;
          created_at?: string;
          created_by?: string;
          ends_at?: string | null;
          household_id?: string;
          id?: string;
          kind?: string;
          notes?: string | null;
          starts_at?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      in_app_notifications: {
        Row: {
          body: string;
          created_at: string;
          household_id: string;
          href: string | null;
          id: string;
          kind: string;
          profile_id: string;
          read_at: string | null;
          title: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          household_id: string;
          href?: string | null;
          id?: string;
          kind: string;
          profile_id: string;
          read_at?: string | null;
          title: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          household_id?: string;
          href?: string | null;
          id?: string;
          kind?: string;
          profile_id?: string;
          read_at?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      medication_doses: {
        Row: {
          caregiver_note: string | null;
          created_at: string;
          due_at: string;
          household_id: string;
          id: string;
          marked_at: string | null;
          marked_by: string | null;
          member_profile_id: string;
          plan_id: string;
          status: string;
        };
        Insert: {
          caregiver_note?: string | null;
          created_at?: string;
          due_at: string;
          household_id: string;
          id?: string;
          marked_at?: string | null;
          marked_by?: string | null;
          member_profile_id: string;
          plan_id: string;
          status?: string;
        };
        Update: {
          caregiver_note?: string | null;
          created_at?: string;
          due_at?: string;
          household_id?: string;
          id?: string;
          marked_at?: string | null;
          marked_by?: string | null;
          member_profile_id?: string;
          plan_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medication_doses_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "medication_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      medication_plans: {
        Row: {
          active: boolean;
          amount_text: string;
          created_at: string;
          created_by: string;
          days_of_week: number[] | null;
          end_on: string | null;
          household_id: string;
          id: string;
          member_profile_id: string;
          name: string;
          notify_organizer: boolean;
          refill_note: string | null;
          reminder_text: string | null;
          start_on: string;
          strength_label: string;
          times: string[];
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          amount_text: string;
          created_at?: string;
          created_by: string;
          days_of_week?: number[] | null;
          end_on?: string | null;
          household_id: string;
          id?: string;
          member_profile_id: string;
          name: string;
          notify_organizer?: boolean;
          refill_note?: string | null;
          reminder_text?: string | null;
          start_on: string;
          strength_label: string;
          times: string[];
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          amount_text?: string;
          created_at?: string;
          created_by?: string;
          days_of_week?: number[] | null;
          end_on?: string | null;
          household_id?: string;
          id?: string;
          member_profile_id?: string;
          name?: string;
          notify_organizer?: boolean;
          refill_note?: string | null;
          reminder_text?: string | null;
          start_on?: string;
          strength_label?: string;
          times?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      member_requests: {
        Row: {
          created_at: string;
          household_id: string;
          id: string;
          kind: string;
          member_profile_id: string;
          message: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          id?: string;
          kind: string;
          member_profile_id: string;
          message?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          id?: string;
          kind?: string;
          member_profile_id?: string;
          message?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          notify_email: boolean;
          notify_in_app: boolean;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id: string;
          notify_email?: boolean;
          notify_in_app?: boolean;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          notify_email?: boolean;
          notify_in_app?: boolean;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      routine_occurrences: {
        Row: {
          assigned_to: string;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          due_at: string;
          household_id: string;
          id: string;
          note: string | null;
          routine_id: string;
          status: string;
        };
        Insert: {
          assigned_to: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          due_at: string;
          household_id: string;
          id?: string;
          note?: string | null;
          routine_id: string;
          status?: string;
        };
        Update: {
          assigned_to?: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          due_at?: string;
          household_id?: string;
          id?: string;
          note?: string | null;
          routine_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routine_occurrences_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
        ];
      };
      routines: {
        Row: {
          active: boolean;
          assigned_to: string;
          created_at: string;
          created_by: string;
          days_of_week: number[] | null;
          end_on: string | null;
          follow_up: string;
          household_id: string;
          id: string;
          kind: string;
          local_time: string;
          notes: string | null;
          recurrence: string;
          start_on: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          assigned_to: string;
          created_at?: string;
          created_by: string;
          days_of_week?: number[] | null;
          end_on?: string | null;
          follow_up?: string;
          household_id: string;
          id?: string;
          kind: string;
          local_time: string;
          notes?: string | null;
          recurrence?: string;
          start_on: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          assigned_to?: string;
          created_at?: string;
          created_by?: string;
          days_of_week?: number[] | null;
          end_on?: string | null;
          follow_up?: string;
          household_id?: string;
          id?: string;
          kind?: string;
          local_time?: string;
          notes?: string | null;
          recurrence?: string;
          start_on?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheduled_deliveries: {
        Row: {
          created_at: string;
          deliver_at: string;
          delivered_at: string | null;
          household_id: string;
          id: string;
          listened_at: string | null;
          recurrence: string;
          status: string;
          voice_note_id: string;
        };
        Insert: {
          created_at?: string;
          deliver_at: string;
          delivered_at?: string | null;
          household_id: string;
          id?: string;
          listened_at?: string | null;
          recurrence?: string;
          status?: string;
          voice_note_id: string;
        };
        Update: {
          created_at?: string;
          deliver_at?: string;
          delivered_at?: string | null;
          household_id?: string;
          id?: string;
          listened_at?: string | null;
          recurrence?: string;
          status?: string;
          voice_note_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scheduled_deliveries_voice_note_id_fkey";
            columns: ["voice_note_id"];
            isOneToOne: false;
            referencedRelation: "voice_notes";
            referencedColumns: ["id"];
          },
        ];
      };
      voice_notes: {
        Row: {
          author_id: string;
          body_text: string | null;
          created_at: string;
          duration_seconds: number | null;
          household_id: string;
          id: string;
          recipient_id: string;
          storage_path: string | null;
          title: string | null;
        };
        Insert: {
          author_id: string;
          body_text?: string | null;
          created_at?: string;
          duration_seconds?: number | null;
          household_id: string;
          id?: string;
          recipient_id: string;
          storage_path?: string | null;
          title?: string | null;
        };
        Update: {
          author_id?: string;
          body_text?: string | null;
          created_at?: string;
          duration_seconds?: number | null;
          household_id?: string;
          id?: string;
          recipient_id?: string;
          storage_path?: string | null;
          title?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string };
      create_invitation: {
        Args: { p_email: string; p_household_id: string; p_role: string };
        Returns: string;
      };
      deliver_due_voice_notes: { Args: Record<string, never>; Returns: number };
      materialize_plan_items: { Args: Record<string, never>; Returns: number };
      invitation_preview: {
        Args: { p_token: string };
        Returns: {
          email: string;
          expires_at: string;
          household_name: string;
          role: string;
        }[];
      };
      revoke_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
