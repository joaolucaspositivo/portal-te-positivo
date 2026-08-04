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
          imagem_url: string | null
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
          imagem_url?: string | null
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
          imagem_url?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ferramentas: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
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
          imagem_url?: string | null
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
          imagem_url?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cargo: string | null
          created_at: string
          id: string
          nome_completo: string | null
          status: Database["public"]["Enums"]["profile_status"]
          telefone: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          created_at?: string
          id: string
          nome_completo?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome_completo?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      solicitacao_campos: {
        Row: {
          chave: string
          created_at: string
          help_text: string | null
          id: string
          label: string
          obrigatorio: boolean
          opcoes: Json
          ordem: number
          placeholder: string | null
          tipo_campo: Database["public"]["Enums"]["campo_tipo"]
          tipo_id: string
          updated_at: string
          validacao: Json
        }
        Insert: {
          chave: string
          created_at?: string
          help_text?: string | null
          id?: string
          label: string
          obrigatorio?: boolean
          opcoes?: Json
          ordem?: number
          placeholder?: string | null
          tipo_campo?: Database["public"]["Enums"]["campo_tipo"]
          tipo_id: string
          updated_at?: string
          validacao?: Json
        }
        Update: {
          chave?: string
          created_at?: string
          help_text?: string | null
          id?: string
          label?: string
          obrigatorio?: boolean
          opcoes?: Json
          ordem?: number
          placeholder?: string | null
          tipo_campo?: Database["public"]["Enums"]["campo_tipo"]
          tipo_id?: string
          updated_at?: string
          validacao?: Json
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_campos_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "solicitacao_tipos"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacao_tipos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
          permite_anonimo: boolean
          responsavel_padrao_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          permite_anonimo?: boolean
          responsavel_padrao_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          permite_anonimo?: boolean
          responsavel_padrao_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_tipos_responsavel_padrao_id_fkey"
            columns: ["responsavel_padrao_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacao_tipos_responsavel_padrao_id_fkey"
            columns: ["responsavel_padrao_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
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
          responsavel_id: string | null
          responsavel_te: string | null
          respostas: Json
          segmento_area: string | null
          solicitante_id: string | null
          status: string
          tipo_id: string | null
          tipo_solicitacao: string
          titulo: string
          unidade: string
          unidade_id: string | null
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
          responsavel_id?: string | null
          responsavel_te?: string | null
          respostas?: Json
          segmento_area?: string | null
          solicitante_id?: string | null
          status?: string
          tipo_id?: string | null
          tipo_solicitacao: string
          titulo: string
          unidade: string
          unidade_id?: string | null
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
          responsavel_id?: string | null
          responsavel_te?: string | null
          respostas?: Json
          segmento_area?: string | null
          solicitante_id?: string | null
          status?: string
          tipo_id?: string | null
          tipo_solicitacao?: string
          titulo?: string
          unidade?: string
          unidade_id?: string | null
          unidades_impactadas?: string | null
          updated_at?: string
          urgencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "solicitacao_tipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string
          email: string | null
          estado: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          responsavel_cargo: string | null
          responsavel_nome: string | null
          sigla: string
          status: Database["public"]["Enums"]["unidade_status"]
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          sigla: string
          status?: Database["public"]["Enums"]["unidade_status"]
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          email?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          responsavel_cargo?: string | null
          responsavel_nome?: string | null
          sigla?: string
          status?: Database["public"]["Enums"]["unidade_status"]
          telefone?: string | null
          updated_at?: string
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
      usuario_unidades: {
        Row: {
          created_at: string
          principal: boolean
          unidade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          principal?: boolean
          unidade_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          principal?: boolean
          unidade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_unidades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          id: string | null
          nome_completo: string | null
          unidade: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          id?: string | null
          nome_completo?: string | null
          unidade?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          id?: string | null
          nome_completo?: string | null
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
      user_pertence_unidade: {
        Args: { _unidade_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "equipe_te" | "editor" | "usuario"
      campo_tipo:
        | "text"
        | "textarea"
        | "email"
        | "url"
        | "number"
        | "date"
        | "select"
        | "multiselect"
        | "checkbox"
      profile_status: "pendente" | "ativo" | "bloqueado"
      unidade_status: "ativa" | "inativa"
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
      app_role: ["admin", "equipe_te", "editor", "usuario"],
      campo_tipo: [
        "text",
        "textarea",
        "email",
        "url",
        "number",
        "date",
        "select",
        "multiselect",
        "checkbox",
      ],
      profile_status: ["pendente", "ativo", "bloqueado"],
      unidade_status: ["ativa", "inativa"],
    },
  },
} as const
