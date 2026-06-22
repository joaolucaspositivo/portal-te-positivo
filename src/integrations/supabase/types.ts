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
      comunicados: {
        Row: {
          autor: string | null
          categoria: string | null
          conteudo: string
          created_at: string
          data_publicacao: string
          destaque: boolean
          id: string
          publicado: boolean
          resumo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          autor?: string | null
          categoria?: string | null
          conteudo: string
          created_at?: string
          data_publicacao?: string
          destaque?: boolean
          id?: string
          publicado?: boolean
          resumo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          autor?: string | null
          categoria?: string | null
          conteudo?: string
          created_at?: string
          data_publicacao?: string
          destaque?: boolean
          id?: string
          publicado?: boolean
          resumo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      contatos: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          funcao: string | null
          id: string
          nome: string
          telefone_whatsapp: string | null
          tipo_contato: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          funcao?: string | null
          id?: string
          nome: string
          telefone_whatsapp?: string | null
          tipo_contato?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          funcao?: string | null
          id?: string
          nome?: string
          telefone_whatsapp?: string | null
          tipo_contato?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ferramentas: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          link_acesso: string | null
          nome: string
          publico_alvo: string | null
          responsavel: string | null
          segmento: string | null
          status: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          link_acesso?: string | null
          nome: string
          publico_alvo?: string | null
          responsavel?: string | null
          segmento?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          link_acesso?: string | null
          nome?: string
          publico_alvo?: string | null
          responsavel?: string | null
          segmento?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes: {
        Row: {
          cargo_funcao: string | null
          created_at: string
          descricao: string
          email_solicitante: string
          id: string
          link_referencia: string | null
          nome_solicitante: string
          observacoes_adicionais: string | null
          observacoes_internas: string | null
          prazo_desejado: string | null
          publico_impactado: string | null
          responsavel_te: string | null
          segmento_area: string | null
          status: string
          tipo_solicitacao: string
          titulo: string
          unidade: string
          unidades_impactadas: string | null
          updated_at: string
          urgencia: string
        }
        Insert: {
          cargo_funcao?: string | null
          created_at?: string
          descricao: string
          email_solicitante: string
          id?: string
          link_referencia?: string | null
          nome_solicitante: string
          observacoes_adicionais?: string | null
          observacoes_internas?: string | null
          prazo_desejado?: string | null
          publico_impactado?: string | null
          responsavel_te?: string | null
          segmento_area?: string | null
          status?: string
          tipo_solicitacao: string
          titulo: string
          unidade: string
          unidades_impactadas?: string | null
          updated_at?: string
          urgencia?: string
        }
        Update: {
          cargo_funcao?: string | null
          created_at?: string
          descricao?: string
          email_solicitante?: string
          id?: string
          link_referencia?: string | null
          nome_solicitante?: string
          observacoes_adicionais?: string | null
          observacoes_internas?: string | null
          prazo_desejado?: string | null
          publico_impactado?: string | null
          responsavel_te?: string | null
          segmento_area?: string | null
          status?: string
          tipo_solicitacao?: string
          titulo?: string
          unidade?: string
          unidades_impactadas?: string | null
          updated_at?: string
          urgencia?: string
        }
        Relationships: []
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
    }
    Views: {
      contatos_public: {
        Row: {
          funcao: string | null
          id: string | null
          nome: string | null
          tipo_contato: string | null
          unidade: string | null
        }
        Insert: {
          funcao?: string | null
          id?: string | null
          nome?: string | null
          tipo_contato?: string | null
          unidade?: string | null
        }
        Update: {
          funcao?: string | null
          id?: string | null
          nome?: string | null
          tipo_contato?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
