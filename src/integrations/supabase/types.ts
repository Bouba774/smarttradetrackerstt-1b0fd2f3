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
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
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
      connection_logs: {
        Row: {
          action_taken: string | null
          asn: string | null
          city: string | null
          client_language: string | null
          client_platform: string | null
          client_screen_resolution: string | null
          client_timezone: string | null
          connection_masked: boolean | null
          country: string | null
          country_code: string | null
          created_at: string
          detection_source: string | null
          hosting_detected: boolean | null
          id: string
          ip_address: string | null
          is_admin_access: boolean | null
          isp: string | null
          language_mismatch: boolean | null
          organization: string | null
          proxy_detected: boolean | null
          raw_detection_data: Json | null
          region: string | null
          risk_factors: Json | null
          risk_level: string | null
          risk_score: number | null
          session_id: string | null
          timezone_mismatch: boolean | null
          tor_detected: boolean | null
          user_agent: string | null
          user_id: string
          user_role: string | null
          vpn_detected: boolean | null
        }
        Insert: {
          action_taken?: string | null
          asn?: string | null
          city?: string | null
          client_language?: string | null
          client_platform?: string | null
          client_screen_resolution?: string | null
          client_timezone?: string | null
          connection_masked?: boolean | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          detection_source?: string | null
          hosting_detected?: boolean | null
          id?: string
          ip_address?: string | null
          is_admin_access?: boolean | null
          isp?: string | null
          language_mismatch?: boolean | null
          organization?: string | null
          proxy_detected?: boolean | null
          raw_detection_data?: Json | null
          region?: string | null
          risk_factors?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          session_id?: string | null
          timezone_mismatch?: boolean | null
          tor_detected?: boolean | null
          user_agent?: string | null
          user_id: string
          user_role?: string | null
          vpn_detected?: boolean | null
        }
        Update: {
          action_taken?: string | null
          asn?: string | null
          city?: string | null
          client_language?: string | null
          client_platform?: string | null
          client_screen_resolution?: string | null
          client_timezone?: string | null
          connection_masked?: boolean | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          detection_source?: string | null
          hosting_detected?: boolean | null
          id?: string
          ip_address?: string | null
          is_admin_access?: boolean | null
          isp?: string | null
          language_mismatch?: boolean | null
          organization?: string | null
          proxy_detected?: boolean | null
          raw_detection_data?: Json | null
          region?: string | null
          risk_factors?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          session_id?: string | null
          timezone_mismatch?: boolean | null
          tor_detected?: boolean | null
          user_agent?: string | null
          user_id?: string
          user_role?: string | null
          vpn_detected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      data_processing_registry: {
        Row: {
          created_at: string
          data_categories: string[]
          id: string
          is_active: boolean | null
          legal_basis: string
          processing_name: string
          purpose: string
          recipients: string[] | null
          retention_period: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_categories: string[]
          id?: string
          is_active?: boolean | null
          legal_basis: string
          processing_name: string
          purpose: string
          recipients?: string[] | null
          retention_period: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_categories?: string[]
          id?: string
          is_active?: boolean | null
          legal_basis?: string
          processing_name?: string
          purpose?: string
          recipients?: string[] | null
          retention_period?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_validation_logs: {
        Row: {
          created_at: string
          domain: string
          domain_age_days: number | null
          email_hash: string
          has_mx_record: boolean | null
          id: string
          ip_address: string | null
          is_disposable: boolean | null
          is_free_provider: boolean | null
          rejection_reason: string | null
          risk_factors: Json | null
          status: string
          user_agent: string | null
          validation_score: number
        }
        Insert: {
          created_at?: string
          domain: string
          domain_age_days?: number | null
          email_hash: string
          has_mx_record?: boolean | null
          id?: string
          ip_address?: string | null
          is_disposable?: boolean | null
          is_free_provider?: boolean | null
          rejection_reason?: string | null
          risk_factors?: Json | null
          status: string
          user_agent?: string | null
          validation_score?: number
        }
        Update: {
          created_at?: string
          domain?: string
          domain_age_days?: number | null
          email_hash?: string
          has_mx_record?: boolean | null
          id?: string
          ip_address?: string | null
          is_disposable?: boolean | null
          is_free_provider?: boolean | null
          rejection_reason?: string | null
          risk_factors?: Json | null
          status?: string
          user_agent?: string | null
          validation_score?: number
        }
        Relationships: []
      }
      gdpr_requests: {
        Row: {
          created_at: string
          data_export_url: string | null
          export_expires_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          request_type: string
          status: string
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_export_url?: string | null
          export_expires_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_export_url?: string | null
          export_expires_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          category_icon: string
          category_key: string
          category_order: number
          created_at: string
          id: string
          is_active: boolean
          question_key: string
          question_order: number
          translations: Json
          updated_at: string
        }
        Insert: {
          category_icon?: string
          category_key: string
          category_order?: number
          created_at?: string
          id?: string
          is_active?: boolean
          question_key: string
          question_order?: number
          translations?: Json
          updated_at?: string
        }
        Update: {
          category_icon?: string
          category_key?: string
          category_order?: number
          created_at?: string
          id?: string
          is_active?: boolean
          question_key?: string
          question_order?: number
          translations?: Json
          updated_at?: string
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
          login_encrypted: string | null
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
          login_encrypted?: string | null
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
          login_encrypted?: string | null
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
      request_nonces: {
        Row: {
          endpoint: string
          expires_at: string
          id: string
          nonce: string
          used_at: string
          user_id: string | null
        }
        Insert: {
          endpoint: string
          expires_at?: string
          id?: string
          nonce: string
          used_at?: string
          user_id?: string | null
        }
        Update: {
          endpoint?: string
          expires_at?: string
          id?: string
          nonce?: string
          used_at?: string
          user_id?: string | null
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
      session_anomalies: {
        Row: {
          anomaly_type: string
          created_at: string
          details: Json | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          severity: string
          user_id: string
        }
        Insert: {
          anomaly_type: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          anomaly_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_anomalies_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
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
          risk_amount: number | null
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
          risk_amount?: number | null
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
          risk_amount?: number | null
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
      trusted_devices: {
        Row: {
          browser_name: string | null
          country: string | null
          created_at: string
          device_fingerprint: string
          device_name: string | null
          id: string
          ip_address: string | null
          is_trusted: boolean | null
          last_used_at: string
          os_name: string | null
          user_id: string
        }
        Insert: {
          browser_name?: string | null
          country?: string | null
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_used_at?: string
          os_name?: string | null
          user_id: string
        }
        Update: {
          browser_name?: string | null
          country?: string | null
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_used_at?: string
          os_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unauthorized_access_logs: {
        Row: {
          attempted_at: string
          details: Json | null
          id: string
          ip_address: string | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
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
      user_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          ip_address: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          id?: string
          ip_address?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          ip_address?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_ip_history: {
        Row: {
          country_code: string | null
          first_seen_at: string
          id: string
          ip_address: string
          last_seen_at: string
          times_seen: number | null
          user_id: string
        }
        Insert: {
          country_code?: string | null
          first_seen_at?: string
          id?: string
          ip_address: string
          last_seen_at?: string
          times_seen?: number | null
          user_id: string
        }
        Update: {
          country_code?: string | null
          first_seen_at?: string
          id?: string
          ip_address?: string
          last_seen_at?: string
          times_seen?: number | null
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
          default_capital: number | null
          default_risk_percent: number | null
          font_size: string | null
          id: string
          known_devices: Json | null
          language: string | null
          max_attempts: number | null
          pin_enabled: boolean | null
          pin_length: number | null
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
          default_capital?: number | null
          default_risk_percent?: number | null
          font_size?: string | null
          id?: string
          known_devices?: Json | null
          language?: string | null
          max_attempts?: number | null
          pin_enabled?: boolean | null
          pin_length?: number | null
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
          default_capital?: number | null
          default_risk_percent?: number | null
          font_size?: string | null
          id?: string
          known_devices?: Json | null
          language?: string | null
          max_attempts?: number | null
          pin_enabled?: boolean | null
          pin_length?: number | null
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
      cleanup_old_ip_history: {
        Args: { retention_days?: number }
        Returns: number
      }
      count_admin_failures: { Args: { p_admin_id: string }; Returns: number }
      count_recent_ips: {
        Args: { p_minutes?: number; p_user_id: string }
        Returns: number
      }
      decrypt_mt_login: {
        Args: { p_encrypted: string; p_user_id: string }
        Returns: string
      }
      delete_admin_secret: { Args: { p_admin_id: string }; Returns: boolean }
      detect_session_anomaly: {
        Args: {
          p_country: string
          p_device_fingerprint: string
          p_ip_address: string
          p_session_id: string
          p_user_id: string
        }
        Returns: Json
      }
      encrypt_mt_login: {
        Args: { p_login: string; p_user_id: string }
        Returns: string
      }
      export_user_data: { Args: { p_user_id: string }; Returns: Json }
      get_own_pin_status: {
        Args: never
        Returns: {
          biometric_enabled: boolean
          has_pin: boolean
          max_attempts: number
          pin_length: number
          user_id: string
          wipe_on_max_attempts: boolean
        }[]
      }
      get_own_sessions_masked: {
        Args: never
        Returns: {
          browser_name: string
          browser_version: string
          country: string
          country_code: string
          created_at: string
          device_type: string
          id: string
          is_mobile: boolean
          os_name: string
          os_version: string
          session_end: string
          session_start: string
          updated_at: string
          user_id: string
        }[]
      }
      get_own_settings_safe: {
        Args: never
        Returns: {
          animations: boolean
          auto_lock_timeout: number
          background: string
          confidential_mode: boolean
          created_at: string
          currency: string
          default_capital: number
          default_risk_percent: number
          font_size: string
          id: string
          language: string
          pin_enabled: boolean
          sounds: boolean
          updated_at: string
          user_id: string
          vibration: boolean
        }[]
      }
      get_own_trusted_devices_masked: {
        Args: never
        Returns: {
          browser_name: string
          country: string
          created_at: string
          device_name: string
          id: string
          is_trusted: boolean
          last_used_at: string
          os_name: string
        }[]
      }
      get_user_anomalies_count: { Args: { p_user_id: string }; Returns: number }
      get_user_pin_status: { Args: { p_user_id: string }; Returns: Json }
      get_user_role_for_security: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_user_sessions_masked: {
        Args: { target_user_id?: string }
        Returns: {
          browser_name: string
          browser_version: string
          country: string
          country_code: string
          created_at: string
          device_type: string
          id: string
          is_mobile: boolean
          os_name: string
          os_version: string
          session_end: string
          session_start: string
          updated_at: string
          user_id: string
        }[]
      }
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
      log_admin_data_access: {
        Args: {
          p_action: string
          p_admin_id: string
          p_ip_address?: string
          p_table_name: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      log_unauthorized_access: {
        Args: { p_details?: Json; p_operation: string; p_table_name: string }
        Returns: undefined
      }
      request_account_deletion: { Args: { p_reason?: string }; Returns: Json }
      request_ip_history_deletion: { Args: never; Returns: Json }
      reset_rate_limit: {
        Args: { p_attempt_type?: string; p_identifier: string }
        Returns: undefined
      }
      scheduled_gdpr_cleanup: { Args: never; Returns: Json }
      set_admin_secret: {
        Args: { p_admin_id: string; p_secret: string }
        Returns: boolean
      }
      update_challenge_progress: {
        Args: { p_challenge_id: string; p_progress: number }
        Returns: Json
      }
      validate_request_nonce: {
        Args: { p_endpoint: string; p_nonce: string; p_user_id?: string }
        Returns: boolean
      }
      verify_admin_secret: {
        Args: { p_admin_id: string; p_secret: string }
        Returns: boolean
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
