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
      assignments: {
        Row: {
          active: boolean
          created_at: string
          driver_id: string
          drone_id: string
          id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          driver_id: string
          drone_id: string
          id?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          driver_id?: string
          drone_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_drone_id_fkey"
            columns: ["drone_id"]
            isOneToOne: false
            referencedRelation: "drones"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_organizations: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          type: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          type: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "donation_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drones: {
        Row: {
          created_at: string
          id: string
          last_updated: string | null
          lat: number | null
          lng: number | null
          name: string
          status: Database["public"]["Enums"]["drone_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          status?: Database["public"]["Enums"]["drone_status"]
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          status?: Database["public"]["Enums"]["drone_status"]
        }
        Relationships: []
      }
      pickups: {
        Row: {
          created_at: string
          drone_id: string | null
          estimated_crv: number | null
          id: string
          items: Json | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lng: number | null
          points_earned: number | null
          status: Database["public"]["Enums"]["pickup_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drone_id?: string | null
          estimated_crv?: number | null
          id?: string
          items?: Json | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          points_earned?: number | null
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drone_id?: string | null
          estimated_crv?: number | null
          id?: string
          items?: Json | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          points_earned?: number | null
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickups_drone_id_fkey"
            columns: ["drone_id"]
            isOneToOne: false
            referencedRelation: "drones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          crv_balance: number
          current_xp: number
          email: string | null
          full_name: string | null
          id: string
          level: number
          role: Database["public"]["Enums"]["user_role"]
          total_items_recycled: number
          total_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          crv_balance?: number
          current_xp?: number
          email?: string | null
          full_name?: string | null
          id: string
          level?: number
          role?: Database["public"]["Enums"]["user_role"]
          total_items_recycled?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          crv_balance?: number
          current_xp?: number
          email?: string | null
          full_name?: string | null
          id?: string
          level?: number
          role?: Database["public"]["Enums"]["user_role"]
          total_items_recycled?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      robot_webhook_events: {
        Row: {
          id: string
          job_id: string
          next_success_step_type: string | null
          payload: Json
          pickup_id: string | null
          point_id: string | null
          point_name: string | null
          received_at: string
          step_type: string | null
          trigger: string
        }
        Insert: {
          id?: string
          job_id: string
          next_success_step_type?: string | null
          payload: Json
          pickup_id?: string | null
          point_id?: string | null
          point_name?: string | null
          received_at?: string
          step_type?: string | null
          trigger: string
        }
        Update: {
          id?: string
          job_id?: string
          next_success_step_type?: string | null
          payload?: Json
          pickup_id?: string | null
          point_id?: string | null
          point_name?: string | null
          received_at?: string
          step_type?: string | null
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "robot_webhook_events_pickup_id_fkey"
            columns: ["pickup_id"]
            isOneToOne: false
            referencedRelation: "pickups"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_logs: {
        Row: {
          barcode: string
          crv_eligible: boolean
          id: string
          product_brand: string | null
          product_category: string | null
          product_size: string | null
          product_title: string | null
          scanned_at: string
          user_id: string | null
        }
        Insert: {
          barcode: string
          crv_eligible?: boolean
          id?: string
          product_brand?: string | null
          product_category?: string | null
          product_size?: string | null
          product_title?: string | null
          scanned_at?: string
          user_id?: string | null
        }
        Update: {
          barcode?: string
          crv_eligible?: boolean
          id?: string
          product_brand?: string | null
          product_category?: string | null
          product_size?: string | null
          product_title?: string | null
          scanned_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_assigned_driver: { Args: { drone_uuid: string }; Returns: boolean }
      is_assigned_user: { Args: { drone_uuid: string }; Returns: boolean }
    }
    Enums: {
      drone_status: "idle" | "active" | "maintenance"
      pickup_status:
        | "pending"
        | "assigned"
        | "in_transit"
        | "completed"
        | "cancelled"
      user_role: "user" | "driver" | "admin"
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
      drone_status: ["idle", "active", "maintenance"],
      pickup_status: [
        "pending",
        "assigned",
        "in_transit",
        "completed",
        "cancelled",
      ],
      user_role: ["user", "driver", "admin"],
    },
  },
} as const
