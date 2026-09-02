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
      achievements: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      conversion_rules: {
        Row: {
          created_at: string
          effective_date: string | null
          eligibility_rules: Json
          id: string
          points_required: number
          status: string
          token_amount: number
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          eligibility_rules?: Json
          id?: string
          points_required: number
          status?: string
          token_amount: number
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          eligibility_rules?: Json
          id?: string
          points_required?: number
          status?: string
          token_amount?: number
        }
        Relationships: []
      }
      earning_sessions: {
        Row: {
          base_rate: number
          created_at: string
          ended_at: string | null
          expected_end_at: string
          id: string
          multiplier: number
          points_accrued: number
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          base_rate: number
          created_at?: string
          ended_at?: string | null
          expected_end_at: string
          id?: string
          multiplier?: number
          points_accrued?: number
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          base_rate?: number
          created_at?: string
          ended_at?: string | null
          expected_end_at?: string
          id?: string
          multiplier?: number
          points_accrued?: number
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      economy_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      levels: {
        Row: {
          badge: string | null
          benefits: string | null
          created_at: string
          id: string
          level_number: number
          multiplier: number
          name: string
          required_points: number
        }
        Insert: {
          badge?: string | null
          benefits?: string | null
          created_at?: string
          id?: string
          level_number: number
          multiplier?: number
          name: string
          required_points?: number
        }
        Update: {
          badge?: string | null
          benefits?: string | null
          created_at?: string
          id?: string
          level_number?: number
          multiplier?: number
          name?: string
          required_points?: number
        }
        Relationships: []
      }
      mission_completions: {
        Row: {
          completed_at: string
          id: string
          mission_id: string
          period_key: string
          reward_transaction_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          mission_id: string
          period_key?: string
          reward_transaction_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          mission_id?: string
          period_key?: string
          reward_transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_completions_reward_transaction_id_fkey"
            columns: ["reward_transaction_id"]
            isOneToOne: false
            referencedRelation: "points_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          max_completions: number | null
          mission_type: string
          repeatable: boolean
          requirement: number
          reward_points: number
          sort_order: number
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_completions?: number | null
          mission_type: string
          repeatable?: boolean
          requirement?: number
          reward_points?: number
          sort_order?: number
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_completions?: number | null
          mission_type?: string
          repeatable?: boolean
          requirement?: number
          reward_points?: number
          sort_order?: number
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_streak: number
          display_name: string | null
          first_name: string | null
          id: string
          is_test: boolean
          last_active_at: string
          last_activity_date: string | null
          last_name: string | null
          level_number: number
          longest_streak: number
          onboarded: boolean
          photo_url: string | null
          points: number
          referral_code: string
          referred_by: string | null
          status: string
          telegram_id: number | null
          telegram_username: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_test?: boolean
          last_active_at?: string
          last_activity_date?: string | null
          last_name?: string | null
          level_number?: number
          longest_streak?: number
          onboarded?: boolean
          photo_url?: string | null
          points?: number
          referral_code: string
          referred_by?: string | null
          status?: string
          telegram_id?: number | null
          telegram_username?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_test?: boolean
          last_active_at?: string
          last_activity_date?: string | null
          last_name?: string | null
          level_number?: number
          longest_streak?: number
          onboarded?: boolean
          photo_url?: string | null
          points?: number
          referral_code?: string
          referred_by?: string | null
          status?: string
          telegram_id?: number | null
          telegram_username?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          qualified_at: string | null
          referred_id: string
          referrer_id: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          qualified_at?: string | null
          referred_id: string
          referrer_id: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          qualified_at?: string | null
          referred_id?: string
          referrer_id?: string
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      token_config: {
        Row: {
          blockchain: string | null
          contract_address: string | null
          created_at: string
          decimals: number | null
          id: string
          status: string
          symbol: string
          token_name: string
        }
        Insert: {
          blockchain?: string | null
          contract_address?: string | null
          created_at?: string
          decimals?: number | null
          id?: string
          status?: string
          symbol: string
          token_name: string
        }
        Update: {
          blockchain?: string | null
          contract_address?: string | null
          created_at?: string
          decimals?: number | null
          id?: string
          status?: string
          symbol?: string
          token_name?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          blockchain: string
          created_at: string
          id: string
          primary_wallet: boolean
          user_id: string
          verified: boolean
          wallet_address: string
          wallet_type: string | null
        }
        Insert: {
          blockchain: string
          created_at?: string
          id?: string
          primary_wallet?: boolean
          user_id: string
          verified?: boolean
          wallet_address: string
          wallet_type?: string | null
        }
        Update: {
          blockchain?: string
          created_at?: string
          id?: string
          primary_wallet?: boolean
          user_id?: string
          verified?: boolean
          wallet_address?: string
          wallet_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_points: {
        Args: { _amount: number; _reason: string; _target: string }
        Returns: Json
      }
      admin_search_users: {
        Args: { _limit?: number; _q?: string }
        Returns: Json
      }
      admin_set_status: {
        Args: { _reason: string; _status: string; _target: string }
        Returns: undefined
      }
      admin_stats: { Args: never; Returns: Json }
      apply_referral: { Args: { _code: string }; Returns: Json }
      award_achievement: {
        Args: { _code: string; _user: string }
        Returns: undefined
      }
      claim_mission: { Args: { _mission_id: string }; Returns: Json }
      complete_earning_session: { Args: never; Returns: Json }
      credit_points: {
        Args: {
          _amount: number
          _desc: string
          _idem: string
          _meta?: Json
          _ref: string
          _type: string
          _user: string
        }
        Returns: string
      }
      get_leaderboard: {
        Args: { _limit?: number; _offset?: number; _period?: string }
        Returns: Json
      }
      get_setting: { Args: { _key: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mission_state: { Args: never; Returns: Json }
      my_rank: { Args: never; Returns: number }
      notify: {
        Args: { _body: string; _kind: string; _title: string; _user: string }
        Returns: undefined
      }
      start_earning_session: {
        Args: never
        Returns: {
          base_rate: number
          created_at: string
          ended_at: string | null
          expected_end_at: string
          id: string
          multiplier: number
          points_accrued: number
          started_at: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "earning_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      streak_multiplier: { Args: { _streak: number }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
