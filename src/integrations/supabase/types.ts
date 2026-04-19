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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      qm_aspects: {
        Row: {
          angle: number
          color: string
          consonance: string
          created_at: string
          harmonic_interval: string
          id: string
          musical_effect: string
          name: string
          orb: number
          sonic_expression: string
          symbol: string
          tension_level: number
        }
        Insert: {
          angle: number
          color: string
          consonance: string
          created_at?: string
          harmonic_interval: string
          id?: string
          musical_effect: string
          name: string
          orb?: number
          sonic_expression: string
          symbol: string
          tension_level: number
        }
        Update: {
          angle?: number
          color?: string
          consonance?: string
          created_at?: string
          harmonic_interval?: string
          id?: string
          musical_effect?: string
          name?: string
          orb?: number
          sonic_expression?: string
          symbol?: string
          tension_level?: number
        }
        Relationships: []
      }
      qm_houses: {
        Row: {
          created_at: string
          domain: string
          dynamic: string
          expression: string
          frequency_range: string
          id: string
          name: string
          number: number
          tonal_area: string
        }
        Insert: {
          created_at?: string
          domain: string
          dynamic: string
          expression: string
          frequency_range: string
          id?: string
          name: string
          number: number
          tonal_area: string
        }
        Update: {
          created_at?: string
          domain?: string
          dynamic?: string
          expression?: string
          frequency_range?: string
          id?: string
          name?: string
          number?: number
          tonal_area?: string
        }
        Relationships: []
      }
      qm_planets: {
        Row: {
          archetypal_energy: string
          created_at: string
          frequency_hz: number
          harmonic_quality: string
          id: string
          instrument: string
          name: string
          note: string
          octave: number
          sonic_character: string
          symbol: string
          timbre: string
        }
        Insert: {
          archetypal_energy: string
          created_at?: string
          frequency_hz: number
          harmonic_quality: string
          id?: string
          instrument: string
          name: string
          note: string
          octave?: number
          sonic_character: string
          symbol: string
          timbre: string
        }
        Update: {
          archetypal_energy?: string
          created_at?: string
          frequency_hz?: number
          harmonic_quality?: string
          id?: string
          instrument?: string
          name?: string
          note?: string
          octave?: number
          sonic_character?: string
          symbol?: string
          timbre?: string
        }
        Relationships: []
      }
      qm_signs: {
        Row: {
          created_at: string
          element: string
          emotional_quality: string
          id: string
          key_signature: string
          modality: string
          musical_mode: string
          name: string
          sonic_palette: string
          symbol: string
          tempo_bpm: number
          texture: string
        }
        Insert: {
          created_at?: string
          element: string
          emotional_quality: string
          id?: string
          key_signature: string
          modality: string
          musical_mode: string
          name: string
          sonic_palette: string
          symbol: string
          tempo_bpm: number
          texture: string
        }
        Update: {
          created_at?: string
          element?: string
          emotional_quality?: string
          id?: string
          key_signature?: string
          modality?: string
          musical_mode?: string
          name?: string
          sonic_palette?: string
          symbol?: string
          tempo_bpm?: number
          texture?: string
        }
        Relationships: []
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
