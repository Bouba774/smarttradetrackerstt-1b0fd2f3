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
        }
        Insert: {
          asset: string
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
        }
        Update: {
          asset?: string
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
      get_user_pin_status: { Args: { p_user_id: string }; Returns: Json }
      reset_rate_limit: {
        Args: { p_attempt_type?: string; p_identifier: string }
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
    Enums: {},
  },
} as const
