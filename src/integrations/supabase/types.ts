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
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          property_id: string | null
          property_title: string | null
          status: string
          time: string | null
          type: string
          updated_at: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string
          time?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string
          time?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          receiver_id: string | null
          sender_id: string
          sender_name: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          receiver_id?: string | null
          sender_id: string
          sender_name?: string
          sender_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          receiver_id?: string | null
          sender_id?: string
          sender_name?: string
          sender_type?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          clicks: number | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          image_url: string | null
          link: string | null
          start_date: string | null
          status: string
          title: string
          type: string
          updated_at: string
          views: number | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          start_date?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          clicks?: number | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          start_date?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          audience: string
          created_at: string
          delivery_channel: string
          description: string | null
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          name: string
          template_body: string | null
          template_body_ar: string | null
          template_title: string | null
          template_title_ar: string | null
          trigger_count: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          audience?: string
          created_at?: string
          delivery_channel?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          name: string
          template_body?: string | null
          template_body_ar?: string | null
          template_title?: string | null
          template_title_ar?: string | null
          trigger_count?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          audience?: string
          created_at?: string
          delivery_channel?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          name?: string
          template_body?: string | null
          template_body_ar?: string | null
          template_title?: string | null
          template_title_ar?: string | null
          trigger_count?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          body_ar: string | null
          created_at: string
          created_by: string | null
          deep_link: string | null
          delivery_channel: string
          id: string
          metadata: Json | null
          open_rate: number | null
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          source_type: string
          status: string
          target: string
          title: string
          title_ar: string | null
          trigger_type: string | null
          type: string
        }
        Insert: {
          body?: string | null
          body_ar?: string | null
          created_at?: string
          created_by?: string | null
          deep_link?: string | null
          delivery_channel?: string
          id?: string
          metadata?: Json | null
          open_rate?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          source_type?: string
          status?: string
          target?: string
          title?: string
          title_ar?: string | null
          trigger_type?: string | null
          type?: string
        }
        Update: {
          body?: string | null
          body_ar?: string | null
          created_at?: string
          created_by?: string | null
          deep_link?: string | null
          delivery_channel?: string
          id?: string
          metadata?: Json | null
          open_rate?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          source_type?: string
          status?: string
          target?: string
          title?: string
          title_ar?: string | null
          trigger_type?: string | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_name: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          authorized_signatory_id_url: string | null
          brokerage_license_url: string | null
          company_name: string | null
          cr_url: string | null
          created_at: string
          email: string
          establishment_card_url: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          trade_license_url: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          agency_name?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          authorized_signatory_id_url?: string | null
          brokerage_license_url?: string | null
          company_name?: string | null
          cr_url?: string | null
          created_at?: string
          email: string
          establishment_card_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          trade_license_url?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          agency_name?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          authorized_signatory_id_url?: string | null
          brokerage_license_url?: string | null
          company_name?: string | null
          cr_url?: string | null
          created_at?: string
          email?: string
          establishment_card_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          trade_license_url?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      project_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_type: string
          image_url: string
          project_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_type?: string
          image_url: string
          project_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_type?: string
          image_url?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          app_image_url: string | null
          banner_url: string | null
          country: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_recommended: boolean
          link_360: string | null
          location: string | null
          location_ar: string | null
          name: string
          name_ar: string | null
          status: string
          suggested_apartments: string | null
          updated_at: string
          video_thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          app_image_url?: string | null
          banner_url?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_recommended?: boolean
          link_360?: string | null
          location?: string | null
          location_ar?: string | null
          name: string
          name_ar?: string | null
          status?: string
          suggested_apartments?: string | null
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          app_image_url?: string | null
          banner_url?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_recommended?: boolean
          link_360?: string | null
          location?: string | null
          location_ar?: string | null
          name?: string
          name_ar?: string | null
          status?: string
          suggested_apartments?: string | null
          updated_at?: string
          video_thumbnail_url?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string | null
          balcony_size: number | null
          bathroom_count: number | null
          bedroom_count: number | null
          brochure_url: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          display_order: number | null
          floor_number: string | null
          floor_plan_url: string | null
          gross_area: number | null
          id: string
          is_featured: boolean | null
          is_recommended: boolean | null
          link_360: string | null
          location: string | null
          location_ar: string | null
          location_google_map_embed_link: string | null
          mark_as_sold: boolean | null
          meta_description: string | null
          meta_description_ar: string | null
          meta_title: string | null
          meta_title_ar: string | null
          name: string
          name_ar: string | null
          net_area: number | null
          price: number | null
          project: string | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          sale_type: Database["public"]["Enums"]["sale_type"] | null
          similar_properties: string | null
          status: Database["public"]["Enums"]["property_status"] | null
          unit_layout_url: string | null
          unit_number: string | null
          updated_at: string
          video_youtube_embed_link: string | null
          whatsapp_number: string | null
        }
        Insert: {
          amenities?: string | null
          balcony_size?: number | null
          bathroom_count?: number | null
          bedroom_count?: number | null
          brochure_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          floor_number?: string | null
          floor_plan_url?: string | null
          gross_area?: number | null
          id?: string
          is_featured?: boolean | null
          is_recommended?: boolean | null
          link_360?: string | null
          location?: string | null
          location_ar?: string | null
          location_google_map_embed_link?: string | null
          mark_as_sold?: boolean | null
          meta_description?: string | null
          meta_description_ar?: string | null
          meta_title?: string | null
          meta_title_ar?: string | null
          name: string
          name_ar?: string | null
          net_area?: number | null
          price?: number | null
          project?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          sale_type?: Database["public"]["Enums"]["sale_type"] | null
          similar_properties?: string | null
          status?: Database["public"]["Enums"]["property_status"] | null
          unit_layout_url?: string | null
          unit_number?: string | null
          updated_at?: string
          video_youtube_embed_link?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          amenities?: string | null
          balcony_size?: number | null
          bathroom_count?: number | null
          bedroom_count?: number | null
          brochure_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          floor_number?: string | null
          floor_plan_url?: string | null
          gross_area?: number | null
          id?: string
          is_featured?: boolean | null
          is_recommended?: boolean | null
          link_360?: string | null
          location?: string | null
          location_ar?: string | null
          location_google_map_embed_link?: string | null
          mark_as_sold?: boolean | null
          meta_description?: string | null
          meta_description_ar?: string | null
          meta_title?: string | null
          meta_title_ar?: string | null
          name?: string
          name_ar?: string | null
          net_area?: number | null
          price?: number | null
          project?: string | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          sale_type?: Database["public"]["Enums"]["sale_type"] | null
          similar_properties?: string | null
          status?: Database["public"]["Enums"]["property_status"] | null
          unit_layout_url?: string | null
          unit_number?: string | null
          updated_at?: string
          video_youtube_embed_link?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          property_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          property_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_types: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_ar: string | null
          unit_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_ar?: string | null
          unit_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_ar?: string | null
          unit_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      registered_clients: {
        Row: {
          agent_id: string
          apt_details: string
          client_name: string
          created_at: string
          email: string
          id: string
          nationality: string
          phone: string
          project: string
        }
        Insert: {
          agent_id: string
          apt_details?: string
          client_name?: string
          created_at?: string
          email?: string
          id?: string
          nationality?: string
          phone?: string
          project?: string
        }
        Update: {
          agent_id?: string
          apt_details?: string
          client_name?: string
          created_at?: string
          email?: string
          id?: string
          nationality?: string
          phone?: string
          project?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_schedules: {
        Row: {
          agent_id: string | null
          agent_name: string
          created_at: string
          id: string
          notes: string | null
          phone_number: string
          project_name: string
          unit_type: string
          visit_date: string
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          phone_number?: string
          project_name?: string
          unit_type?: string
          visit_date?: string
        }
        Update: {
          agent_id?: string | null
          agent_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          phone_number?: string
          project_name?: string
          unit_type?: string
          visit_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator"
      approval_status: "pending" | "approved" | "rejected" | "suspended"
      property_status: "active" | "draft" | "sold" | "rented" | "inactive"
      property_type:
        | "apartment"
        | "villa"
        | "office"
        | "land"
        | "penthouse"
        | "townhouse"
        | "studio"
      sale_type: "sale" | "rent" | "both"
      user_type: "user" | "agent" | "agency"
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
      app_role: ["admin", "moderator"],
      approval_status: ["pending", "approved", "rejected", "suspended"],
      property_status: ["active", "draft", "sold", "rented", "inactive"],
      property_type: [
        "apartment",
        "villa",
        "office",
        "land",
        "penthouse",
        "townhouse",
        "studio",
      ],
      sale_type: ["sale", "rent", "both"],
      user_type: ["user", "agent", "agency"],
    },
  },
} as const
