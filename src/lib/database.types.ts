export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          notifications: Json
          trading_preferences: Json
          security_settings: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          notifications?: Json
          trading_preferences?: Json
          security_settings?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          notifications?: Json
          trading_preferences?: Json
          security_settings?: Json
          updated_at?: string
        }
      }
      trading_history: {
        Row: {
          id: string
          user_id: string
          symbol: string
          type: string
          price: number
          quantity: number
          executed_at: string
          profit_loss: number | null
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          type: string
          price: number
          quantity: number
          executed_at?: string
          profit_loss?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          type?: string
          price?: number
          quantity?: number
          executed_at?: string
          profit_loss?: number | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}