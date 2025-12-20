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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_login_attempts: {
        Row: {
          admin_id: string
          attempt_at: string
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          attempt_at?: string
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          attempt_at?: string
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_secrets: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          secret_hash: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          secret_hash: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          secret_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_permanent: boolean
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_permanent?: boolean
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_permanent?: boolean
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          checklist: Json | null
          created_at: string
          daily_objective: string | null
          entry_date: string
          id: string
          lessons: string | null
          notes: string | null
          rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          daily_objective?: string | null
          entry_date: string
          id?: string
          lessons?: string | null
          notes?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          daily_objective?: string | null
          entry_date?: string
          id?: string
          lessons?: string | null
          notes?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mt_accounts: {
        Row: {
          account_name: string
          created_at: string
          currency: string
          id: string
          initial_balance: number
          is_connected: boolean
          last_sync_at: string | null
          login: string
          metaapi_account_id: string | null
          platform: string
          server: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          created_at?: string
          currency?: string
          id?: string
          initial_balance?: number
          is_connected?: boolean
          last_sync_at?: string | null
          login: string
          metaapi_account_id?: string | null
          platform: string
          server: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          created_at?: string
          currency?: string
          id?: string
          initial_balance?: number
          is_connected?: boolean
          last_sync_at?: string | null
          login?: string
          metaapi_account_id?: string | null
          platform?: string
          server?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          level: number | null
          monthly_objective_profit: number | null
          nickname: string
          total_points: number | null
          trading_style: string | null
          updated_at: string
          user_id: string
          weekly_objective_trades: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          level?: number | null
          monthly_objective_profit?: number | null
          nickname: string
          total_points?: number | null
          trading_style?: string | null
          updated_at?: string
          user_id: string
          weekly_objective_trades?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          level?: number | null
          monthly_objective_profit?: number | null
          nickname?: string
          total_points?: number | null
          trading_style?: string | null
          updated_at?: string
          user_id?: string
          weekly_objective_trades?: number | null
        }
        Relationships: []
      }
      rate_limit_attempts: {
        Row: {
          attempt_type: string
          attempts_count: number
          blocked_until: string | null
          created_at: string
          first_attempt_at: string
          id: string
          identifier: string
          last_attempt_at: string
        }
        Insert: {
          attempt_type?: string
          attempts_count?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
        }
        Update: {
          attempt_type?: string
          attempts_count?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      secure_credentials: {
        Row: {
          biometric_enabled: boolean | null
          created_at: string
          id: string
          max_attempts: number | null
          pin_hash: string | null
          pin_length: number | null
          pin_salt: string | null
          updated_at: string
          user_id: string
          wipe_on_max_attempts: boolean | null
        }
        Insert: {
          biometric_enabled?: boolean | null
          created_at?: string
          id?: string
          max_attempts?: number | null
          pin_hash?: string | null
          pin_length?: number | null
          pin_salt?: string | null
          updated_at?: string
          user_id: string
          wipe_on_max_attempts?: boolean | null
        }
        Update: {
          biometric_enabled?: boolean | null
          created_at?: string
          id?: string
          max_attempts?: number | null
          pin_hash?: string | null
          pin_length?: number | null
          pin_salt?: string | null
          updated_at?: string
          user_id?: string
          wipe_on_max_attempts?: boolean | null
        }
        Relationships: []
      }
      trades: {
        Row: {
          asset: string
          audios: string[] | null
          created_at: string
          custom_setup: string | null
          direction: string
          duration_seconds: number | null
          emotions: string | null
          entry_price: number
          exit_method: string | null
          exit_price: number | null
          exit_timestamp: string | null
          id: string
          images: string[] | null
          lot_size: number
          notes: string | null
          profit_loss: number | null
          result: string | null
          setup: string | null
          stop_loss: number | null
          take_profit: number | null
          timeframe: string | null
          trade_date: string
          updated_at: string
          user_id: string
          videos: string[] | null
        }
        Insert: {
          asset: string
          audios?: string[] | null
          created_at?: string
          custom_setup?: string | null
          direction: string
          duration_seconds?: number | null
          emotions?: string | null
          entry_price: number
          exit_method?: string | null
          exit_price?: number | null
          exit_timestamp?: string | null
          id?: string
          images?: string[] | null
          lot_size: number
          notes?: string | null
          profit_loss?: number | null
          result?: string | null
          setup?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          timeframe?: string | null
          trade_date?: string
          updated_at?: string
          user_id: string
          videos?: string[] | null
        }
        Update: {
          asset?: string
          audios?: string[] | null
          created_at?: string
          custom_setup?: string | null
          direction?: string
          duration_seconds?: number | null
          emotions?: string | null
          entry_price?: number
          exit_method?: string | null
          exit_price?: number | null
          exit_timestamp?: string | null
          id?: string
          images?: string[] | null
          lot_size?: number
          notes?: string | null
          profit_loss?: number | null
          result?: string | null
          setup?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          timeframe?: string | null
          trade_date?: string
          updated_at?: string
          user_id?: string
          videos?: string[] | null
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          points_earned: number | null
          popup_shown: boolean | null
          progress: number | null
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          points_earned?: number | null
          popup_shown?: boolean | null
          progress?: number | null
          target: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          points_earned?: number | null
          popup_shown?: boolean | null
          progress?: number | null
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device_model: string | null
          device_type: string | null
          device_vendor: string | null
          id: string
          ip_address: string | null
          is_mobile: boolean | null
          isp: string | null
          language: string | null
          os_name: string | null
          os_version: string | null
          region: string | null
          screen_height: number | null
          screen_width: number | null
          session_end: string | null
          session_start: string
          timezone: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_model?: string | null
          device_type?: string | null
          device_vendor?: string | null
          id?: string
          ip_address?: string | null
          is_mobile?: boolean | null
          isp?: string | null
          language?: string | null
          os_name?: string | null
          os_version?: string | null
          region?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_end?: string | null
          session_start?: string
          timezone?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_model?: string | null
          device_type?: string | null
          device_vendor?: string | null
          id?: string
          ip_address?: string | null
          is_mobile?: boolean | null
          isp?: string | null
          language?: string | null
          os_name?: string | null
          os_version?: string | null
          region?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_end?: string | null
          session_start?: string
          timezone?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          animations: boolean | null
          auto_lock_timeout: number | null
          background: string | null
          biometric_enabled: boolean | null
          confidential_mode: boolean | null
          created_at: string
          currency: string | null
          font_size: string | null
          id: string
          known_devices: Json | null
          max_attempts: number | null
          pin_enabled: boolean | null
          pin_hash: string | null
          pin_length: number | null
          pin_salt: string | null
          sounds: boolean | null
          updated_at: string
          user_id: string
          vibration: boolean | null
          wipe_on_max_attempts: boolean | null
        }
        Insert: {
          animations?: boolean | null
          auto_lock_timeout?: number | null
          background?: string | null
          biometric_enabled?: boolean | null
          confidential_mode?: boolean | null
          created_at?: string
          currency?: string | null
          font_size?: string | null
          id?: string
          known_devices?: Json | null
          max_attempts?: number | null
          pin_enabled?: boolean | null
          pin_hash?: string | null
          pin_length?: number | null
          pin_salt?: string | null
          sounds?: boolean | null
          updated_at?: string
          user_id: string
          vibration?: boolean | null
          wipe_on_max_attempts?: boolean | null
        }
        Update: {
          animations?: boolean | null
          auto_lock_timeout?: number | null
          background?: string | null
          biometric_enabled?: boolean | null
          confidential_mode?: boolean | null
          created_at?: string
          currency?: string | null
          font_size?: string | null
          id?: string
          known_devices?: Json | null
          max_attempts?: number | null
          pin_enabled?: boolean | null
          pin_hash?: string | null
          pin_length?: number | null
          pin_salt?: string | null
          sounds?: boolean | null
          updated_at?: string
          user_id?: string
          vibration?: boolean | null
          wipe_on_max_attempts?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_attempt_type?: string
          p_block_minutes?: number
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      count_admin_failures: { Args: { p_admin_id: string }; Returns: number }
      get_user_pin_status: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_blocked: { Args: { p_admin_id: string }; Returns: boolean }
      is_user_banned: { Args: { _user_id: string }; Returns: boolean }
      reset_rate_limit: {
        Args: { p_attempt_type?: string; p_identifier: string }
        Returns: undefined
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
