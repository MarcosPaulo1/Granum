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
      alteracao_escopo: {
        Row: {
          aprovado_por: number | null
          created_at: string | null
          data_aprovacao: string | null
          data_solicitacao: string
          descricao: string
          id_alteracao: number
          id_obra: number
          id_responsavel: number | null
          impacto_dias: number | null
          impacto_valor: number | null
          justificativa: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          aprovado_por?: number | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_solicitacao?: string
          descricao: string
          id_alteracao?: number
          id_obra: number
          id_responsavel?: number | null
          impacto_dias?: number | null
          impacto_valor?: number | null
          justificativa?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          aprovado_por?: number | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_solicitacao?: string
          descricao?: string
          id_alteracao?: number
          id_obra?: number
          id_responsavel?: number | null
          impacto_dias?: number | null
          impacto_valor?: number | null
          justificativa?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alteracao_escopo_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
          {
            foreignKeyName: "alteracao_escopo_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "alteracao_escopo_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "alteracao_escopo_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "alteracao_escopo_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "alteracao_escopo_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      centro_custo: {
        Row: {
          ativo: boolean | null
          codigo: string
          descricao: string | null
          id_centro_custo: number
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          descricao?: string | null
          id_centro_custo?: number
          nome: string
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          descricao?: string | null
          id_centro_custo?: number
          nome?: string
        }
        Relationships: []
      }
      cliente: {
        Row: {
          auth_user_id: string | null
          cpf_cnpj: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id_cliente: number
          nome: string
          observacoes: string | null
          portal_ativo: boolean | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id_cliente?: number
          nome: string
          observacoes?: string | null
          portal_ativo?: boolean | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id_cliente?: number
          nome?: string
          observacoes?: string | null
          portal_ativo?: boolean | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contrato_trabalho: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          id_contrato: number
          id_obra: number
          id_tarefa: number | null
          id_trabalhador: number
          observacoes: string | null
          status: string | null
          tipo_pagamento: string
          unidade_valor: string
          updated_at: string | null
          valor_acordado: number
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          id_contrato?: number
          id_obra: number
          id_tarefa?: number | null
          id_trabalhador: number
          observacoes?: string | null
          status?: string | null
          tipo_pagamento: string
          unidade_valor?: string
          updated_at?: string | null
          valor_acordado: number
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          id_contrato?: number
          id_obra?: number
          id_tarefa?: number | null
          id_trabalhador?: number
          observacoes?: string | null
          status?: string | null
          tipo_pagamento?: string
          unidade_valor?: string
          updated_at?: string | null
          valor_acordado?: number
        }
        Relationships: [
          {
            foreignKeyName: "contrato_trabalho_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "contrato_trabalho_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "contrato_trabalho_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "contrato_trabalho_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "contrato_trabalho_id_tarefa_fkey"
            columns: ["id_tarefa"]
            isOneToOne: false
            referencedRelation: "tarefa"
            referencedColumns: ["id_tarefa"]
          },
          {
            foreignKeyName: "contrato_trabalho_id_trabalhador_fkey"
            columns: ["id_trabalhador"]
            isOneToOne: false
            referencedRelation: "trabalhador"
            referencedColumns: ["id_trabalhador"]
          },
        ]
      }
      diario_obra: {
        Row: {
          clima_chuva: boolean | null
          clima_condicao: string | null
          clima_descricao: string | null
          clima_temperatura: number | null
          conteudo: string | null
          created_at: string | null
          data: string
          id_diario: number
          id_obra: number
          id_responsavel: number | null
          origem: string | null
          status_revisao: string | null
        }
        Insert: {
          clima_chuva?: boolean | null
          clima_condicao?: string | null
          clima_descricao?: string | null
          clima_temperatura?: number | null
          conteudo?: string | null
          created_at?: string | null
          data: string
          id_diario?: number
          id_obra: number
          id_responsavel?: number | null
          origem?: string | null
          status_revisao?: string | null
        }
        Update: {
          clima_chuva?: boolean | null
          clima_condicao?: string | null
          clima_descricao?: string | null
          clima_temperatura?: number | null
          conteudo?: string | null
          created_at?: string | null
          data?: string
          id_diario?: number
          id_obra?: number
          id_responsavel?: number | null
          origem?: string | null
          status_revisao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diario_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "diario_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "diario_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "diario_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "diario_obra_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      documento: {
        Row: {
          data_criacao: string | null
          id_documento: number
          id_obra: number
          id_responsavel: number | null
          nome: string
          tipo: string
          url_sharepoint: string | null
        }
        Insert: {
          data_criacao?: string | null
          id_documento?: number
          id_obra: number
          id_responsavel?: number | null
          nome: string
          tipo: string
          url_sharepoint?: string | null
        }
        Update: {
          data_criacao?: string | null
          id_documento?: number
          id_obra?: number
          id_responsavel?: number | null
          nome?: string
          tipo?: string
          url_sharepoint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "documento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "documento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "documento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "documento_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      escala: {
        Row: {
          data_prevista: string
          id_contrato: number
          id_escala: number
          id_obra: number
          id_trabalhador: number
          status: string | null
          turno: string | null
        }
        Insert: {
          data_prevista: string
          id_contrato: number
          id_escala?: number
          id_obra: number
          id_trabalhador: number
          status?: string | null
          turno?: string | null
        }
        Update: {
          data_prevista?: string
          id_contrato?: number
          id_escala?: number
          id_obra?: number
          id_trabalhador?: number
          status?: string | null
          turno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato_trabalho"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "escala_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "escala_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "escala_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "escala_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "escala_id_trabalhador_fkey"
            columns: ["id_trabalhador"]
            isOneToOne: false
            referencedRelation: "trabalhador"
            referencedColumns: ["id_trabalhador"]
          },
        ]
      }
      etapa: {
        Row: {
          codigo: string
          descricao: string | null
          id_etapa: number
          nome: string
          ordem: number
        }
        Insert: {
          codigo: string
          descricao?: string | null
          id_etapa?: number
          nome: string
          ordem?: number
        }
        Update: {
          codigo?: string
          descricao?: string | null
          id_etapa?: number
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      fornecedor: {
        Row: {
          ativo: boolean | null
          cnpj: string | null
          contato: string | null
          created_at: string | null
          email: string | null
          id_fornecedor: number
          nome: string
          observacoes: string | null
          tipo: string | null
        }
        Insert: {
          ativo?: boolean | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string | null
          email?: string | null
          id_fornecedor?: number
          nome: string
          observacoes?: string | null
          tipo?: string | null
        }
        Update: {
          ativo?: boolean | null
          cnpj?: string | null
          contato?: string | null
          created_at?: string | null
          email?: string | null
          id_fornecedor?: number
          nome?: string
          observacoes?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      foto_obra: {
        Row: {
          data_foto: string | null
          id_diario: number | null
          id_foto: number
          id_obra: number
          id_pendencia: number | null
          id_responsavel: number | null
          id_tarefa: number | null
          legenda: string | null
          localizacao_obra: string | null
          url_sharepoint: string
        }
        Insert: {
          data_foto?: string | null
          id_diario?: number | null
          id_foto?: number
          id_obra: number
          id_pendencia?: number | null
          id_responsavel?: number | null
          id_tarefa?: number | null
          legenda?: string | null
          localizacao_obra?: string | null
          url_sharepoint: string
        }
        Update: {
          data_foto?: string | null
          id_diario?: number | null
          id_foto?: number
          id_obra?: number
          id_pendencia?: number | null
          id_responsavel?: number | null
          id_tarefa?: number | null
          legenda?: string | null
          localizacao_obra?: string | null
          url_sharepoint?: string
        }
        Relationships: [
          {
            foreignKeyName: "foto_obra_id_diario_fkey"
            columns: ["id_diario"]
            isOneToOne: false
            referencedRelation: "diario_obra"
            referencedColumns: ["id_diario"]
          },
          {
            foreignKeyName: "foto_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "foto_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "foto_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "foto_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "foto_obra_id_pendencia_fkey"
            columns: ["id_pendencia"]
            isOneToOne: false
            referencedRelation: "pendencia"
            referencedColumns: ["id_pendencia"]
          },
          {
            foreignKeyName: "foto_obra_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
          {
            foreignKeyName: "foto_obra_id_tarefa_fkey"
            columns: ["id_tarefa"]
            isOneToOne: false
            referencedRelation: "tarefa"
            referencedColumns: ["id_tarefa"]
          },
        ]
      }
      grupo_movimento: {
        Row: {
          descricao: string | null
          id_grupo: number
          nome: string
        }
        Insert: {
          descricao?: string | null
          id_grupo?: number
          nome: string
        }
        Update: {
          descricao?: string | null
          id_grupo?: number
          nome?: string
        }
        Relationships: []
      }
      inspecao: {
        Row: {
          checklist: Json
          created_at: string | null
          data: string
          id_inspecao: number
          id_obra: number
          id_responsavel: number
          observacoes: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          checklist?: Json
          created_at?: string | null
          data?: string
          id_inspecao?: number
          id_obra: number
          id_responsavel: number
          observacoes?: string | null
          status?: string | null
          tipo: string
        }
        Update: {
          checklist?: Json
          created_at?: string | null
          data?: string
          id_inspecao?: number
          id_obra?: number
          id_responsavel?: number
          observacoes?: string | null
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspecao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "inspecao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "inspecao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "inspecao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "inspecao_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      lancamento: {
        Row: {
          created_at: string | null
          data_competencia: string
          data_pagamento: string | null
          entrada_saida: string
          forma_pagamento: string | null
          historico: string | null
          id_alteracao_escopo: number | null
          id_centro_custo: number
          id_fornecedor: number | null
          id_grupo_movimento: number | null
          id_lancamento: number
          id_obra: number
          id_plano_conta: number | null
          id_responsavel: number
          id_tarefa: number | null
          tipo: string
          updated_at: string | null
          updated_by: number | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_competencia: string
          data_pagamento?: string | null
          entrada_saida: string
          forma_pagamento?: string | null
          historico?: string | null
          id_alteracao_escopo?: number | null
          id_centro_custo: number
          id_fornecedor?: number | null
          id_grupo_movimento?: number | null
          id_lancamento?: number
          id_obra: number
          id_plano_conta?: number | null
          id_responsavel: number
          id_tarefa?: number | null
          tipo: string
          updated_at?: string | null
          updated_by?: number | null
          valor: number
        }
        Update: {
          created_at?: string | null
          data_competencia?: string
          data_pagamento?: string | null
          entrada_saida?: string
          forma_pagamento?: string | null
          historico?: string | null
          id_alteracao_escopo?: number | null
          id_centro_custo?: number
          id_fornecedor?: number | null
          id_grupo_movimento?: number | null
          id_lancamento?: number
          id_obra?: number
          id_plano_conta?: number | null
          id_responsavel?: number
          id_tarefa?: number | null
          tipo?: string
          updated_at?: string | null
          updated_by?: number | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_id_alteracao_escopo_fkey"
            columns: ["id_alteracao_escopo"]
            isOneToOne: false
            referencedRelation: "alteracao_escopo"
            referencedColumns: ["id_alteracao"]
          },
          {
            foreignKeyName: "lancamento_id_centro_custo_fkey"
            columns: ["id_centro_custo"]
            isOneToOne: false
            referencedRelation: "centro_custo"
            referencedColumns: ["id_centro_custo"]
          },
          {
            foreignKeyName: "lancamento_id_fornecedor_fkey"
            columns: ["id_fornecedor"]
            isOneToOne: false
            referencedRelation: "fornecedor"
            referencedColumns: ["id_fornecedor"]
          },
          {
            foreignKeyName: "lancamento_id_grupo_movimento_fkey"
            columns: ["id_grupo_movimento"]
            isOneToOne: false
            referencedRelation: "grupo_movimento"
            referencedColumns: ["id_grupo"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_plano_conta_fkey"
            columns: ["id_plano_conta"]
            isOneToOne: false
            referencedRelation: "plano_conta"
            referencedColumns: ["id_plano"]
          },
          {
            foreignKeyName: "lancamento_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
          {
            foreignKeyName: "lancamento_id_tarefa_fkey"
            columns: ["id_tarefa"]
            isOneToOne: false
            referencedRelation: "tarefa"
            referencedColumns: ["id_tarefa"]
          },
          {
            foreignKeyName: "lancamento_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      log_auditoria: {
        Row: {
          acao: string
          campo: string | null
          created_at: string | null
          id_log: number
          id_registro: number
          id_responsavel: number | null
          tabela: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          acao: string
          campo?: string | null
          created_at?: string | null
          id_log?: number
          id_registro: number
          id_responsavel?: number | null
          tabela: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          acao?: string
          campo?: string | null
          created_at?: string | null
          id_log?: number
          id_registro?: number
          id_responsavel?: number | null
          tabela?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_auditoria_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      notificacao: {
        Row: {
          created_at: string | null
          id_notificacao: number
          id_obra: number | null
          id_responsavel: number
          lida: boolean | null
          link: string | null
          mensagem: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          id_notificacao?: number
          id_obra?: number | null
          id_responsavel: number
          lida?: boolean | null
          link?: string | null
          mensagem?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          id_notificacao?: number
          id_obra?: number | null
          id_responsavel?: number
          lida?: boolean | null
          link?: string | null
          mensagem?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "notificacao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "notificacao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "notificacao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "notificacao_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      obra: {
        Row: {
          created_at: string | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          descricao: string | null
          endereco: string | null
          id_centro_custo: number | null
          id_cliente: number
          id_obra: number
          id_responsavel: number | null
          latitude: number | null
          longitude: number | null
          nome: string
          percentual_finalizada: number | null
          status: string | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          created_at?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          endereco?: string | null
          id_centro_custo?: number | null
          id_cliente: number
          id_obra?: number
          id_responsavel?: number | null
          latitude?: number | null
          longitude?: number | null
          nome: string
          percentual_finalizada?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          created_at?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          endereco?: string | null
          id_centro_custo?: number | null
          id_cliente?: number
          id_obra?: number
          id_responsavel?: number | null
          latitude?: number | null
          longitude?: number | null
          nome?: string
          percentual_finalizada?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_id_centro_custo_fkey"
            columns: ["id_centro_custo"]
            isOneToOne: false
            referencedRelation: "centro_custo"
            referencedColumns: ["id_centro_custo"]
          },
          {
            foreignKeyName: "obra_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "obra_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
          {
            foreignKeyName: "obra_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      orcamento_versao: {
        Row: {
          conteudo_json: Json
          created_at: string | null
          descricao: string | null
          id_alteracao_escopo: number | null
          id_obra: number
          id_responsavel: number | null
          id_versao: number
          nome: string
          numero_versao: number
          prazo_dias: number | null
          status: string | null
          valor_total: number
        }
        Insert: {
          conteudo_json: Json
          created_at?: string | null
          descricao?: string | null
          id_alteracao_escopo?: number | null
          id_obra: number
          id_responsavel?: number | null
          id_versao?: number
          nome: string
          numero_versao: number
          prazo_dias?: number | null
          status?: string | null
          valor_total: number
        }
        Update: {
          conteudo_json?: Json
          created_at?: string | null
          descricao?: string | null
          id_alteracao_escopo?: number | null
          id_obra?: number
          id_responsavel?: number | null
          id_versao?: number
          nome?: string
          numero_versao?: number
          prazo_dias?: number | null
          status?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_versao_id_alteracao_escopo_fkey"
            columns: ["id_alteracao_escopo"]
            isOneToOne: false
            referencedRelation: "alteracao_escopo"
            referencedColumns: ["id_alteracao"]
          },
          {
            foreignKeyName: "orcamento_versao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "orcamento_versao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "orcamento_versao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "orcamento_versao_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "orcamento_versao_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      parcela: {
        Row: {
          data_pagamento: string | null
          data_vencimento: string
          id_lancamento: number
          id_parcela: number
          numero: number
          status: string | null
          valor: number
        }
        Insert: {
          data_pagamento?: string | null
          data_vencimento: string
          id_lancamento: number
          id_parcela?: number
          numero: number
          status?: string | null
          valor: number
        }
        Update: {
          data_pagamento?: string | null
          data_vencimento?: string
          id_lancamento?: number
          id_parcela?: number
          numero?: number
          status?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcela_id_lancamento_fkey"
            columns: ["id_lancamento"]
            isOneToOne: false
            referencedRelation: "lancamento"
            referencedColumns: ["id_lancamento"]
          },
        ]
      }
      pendencia: {
        Row: {
          created_at: string | null
          data_abertura: string
          data_resolucao: string | null
          descricao: string
          id_obra: number
          id_pendencia: number
          id_responsavel: number | null
          id_tarefa: number | null
          localizacao: string | null
          observacoes: string | null
          prioridade: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_abertura?: string
          data_resolucao?: string | null
          descricao: string
          id_obra: number
          id_pendencia?: number
          id_responsavel?: number | null
          id_tarefa?: number | null
          localizacao?: string | null
          observacoes?: string | null
          prioridade?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_abertura?: string
          data_resolucao?: string | null
          descricao?: string
          id_obra?: number
          id_pendencia?: number
          id_responsavel?: number | null
          id_tarefa?: number | null
          localizacao?: string | null
          observacoes?: string | null
          prioridade?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pendencia_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "pendencia_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "pendencia_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "pendencia_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "pendencia_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
          {
            foreignKeyName: "pendencia_id_tarefa_fkey"
            columns: ["id_tarefa"]
            isOneToOne: false
            referencedRelation: "tarefa"
            referencedColumns: ["id_tarefa"]
          },
        ]
      }
      perfil: {
        Row: {
          descricao: string | null
          id_perfil: number
          nome: string
          permissoes: Json
        }
        Insert: {
          descricao?: string | null
          id_perfil?: number
          nome: string
          permissoes?: Json
        }
        Update: {
          descricao?: string | null
          id_perfil?: number
          nome?: string
          permissoes?: Json
        }
        Relationships: []
      }
      plano_conta: {
        Row: {
          analitica: boolean | null
          codigo: string | null
          id_pai: number | null
          id_plano: number
          nome: string
          tipo_plano: string | null
        }
        Insert: {
          analitica?: boolean | null
          codigo?: string | null
          id_pai?: number | null
          id_plano?: number
          nome: string
          tipo_plano?: string | null
        }
        Update: {
          analitica?: boolean | null
          codigo?: string | null
          id_pai?: number | null
          id_plano?: number
          nome?: string
          tipo_plano?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plano_conta_id_pai_fkey"
            columns: ["id_pai"]
            isOneToOne: false
            referencedRelation: "plano_conta"
            referencedColumns: ["id_plano"]
          },
        ]
      }
      presenca: {
        Row: {
          horas_trabalhadas: number | null
          id_contrato: number
          id_diario: number
          id_presenca: number
          id_trabalhador: number
          observacoes: string | null
          tipo_presenca: string
          valor_dia: number | null
        }
        Insert: {
          horas_trabalhadas?: number | null
          id_contrato: number
          id_diario: number
          id_presenca?: number
          id_trabalhador: number
          observacoes?: string | null
          tipo_presenca: string
          valor_dia?: number | null
        }
        Update: {
          horas_trabalhadas?: number | null
          id_contrato?: number
          id_diario?: number
          id_presenca?: number
          id_trabalhador?: number
          observacoes?: string | null
          tipo_presenca?: string
          valor_dia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "presenca_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato_trabalho"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "presenca_id_diario_fkey"
            columns: ["id_diario"]
            isOneToOne: false
            referencedRelation: "diario_obra"
            referencedColumns: ["id_diario"]
          },
          {
            foreignKeyName: "presenca_id_trabalhador_fkey"
            columns: ["id_trabalhador"]
            isOneToOne: false
            referencedRelation: "trabalhador"
            referencedColumns: ["id_trabalhador"]
          },
        ]
      }
      responsavel: {
        Row: {
          ativo: boolean | null
          auth_user_id: string | null
          cargo: string | null
          created_at: string | null
          data_admissao: string | null
          data_desligamento: string | null
          departamento: string | null
          email: string | null
          id_perfil: number
          id_responsavel: number
          nome: string
          observacoes: string | null
          telefone: string | null
          telefone_whatsapp: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          auth_user_id?: string | null
          cargo?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          departamento?: string | null
          email?: string | null
          id_perfil: number
          id_responsavel?: number
          nome: string
          observacoes?: string | null
          telefone?: string | null
          telefone_whatsapp?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          auth_user_id?: string | null
          cargo?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          departamento?: string | null
          email?: string | null
          id_perfil?: number
          id_responsavel?: number
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          telefone_whatsapp?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "responsavel_id_perfil_fkey"
            columns: ["id_perfil"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id_perfil"]
          },
        ]
      }
      tarefa: {
        Row: {
          conclusao_real: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id_etapa: number | null
          id_obra: number
          id_responsavel: number | null
          id_tarefa: number
          id_tarefa_predecessora: number | null
          nome: string
          orcamento_previsto: number | null
          ordem: number | null
          percentual_concluido: number | null
          status: string | null
          updated_at: string | null
          updated_by: number | null
        }
        Insert: {
          conclusao_real?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id_etapa?: number | null
          id_obra: number
          id_responsavel?: number | null
          id_tarefa?: number
          id_tarefa_predecessora?: number | null
          nome: string
          orcamento_previsto?: number | null
          ordem?: number | null
          percentual_concluido?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Update: {
          conclusao_real?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id_etapa?: number | null
          id_obra?: number
          id_responsavel?: number | null
          id_tarefa?: number
          id_tarefa_predecessora?: number | null
          nome?: string
          orcamento_previsto?: number | null
          ordem?: number | null
          percentual_concluido?: number | null
          status?: string | null
          updated_at?: string | null
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_id_etapa_fkey"
            columns: ["id_etapa"]
            isOneToOne: false
            referencedRelation: "etapa"
            referencedColumns: ["id_etapa"]
          },
          {
            foreignKeyName: "tarefa_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "tarefa_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "tarefa_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "tarefa_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "tarefa_id_responsavel_fkey"
            columns: ["id_responsavel"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
          {
            foreignKeyName: "tarefa_id_tarefa_predecessora_fkey"
            columns: ["id_tarefa_predecessora"]
            isOneToOne: false
            referencedRelation: "tarefa"
            referencedColumns: ["id_tarefa"]
          },
          {
            foreignKeyName: "tarefa_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "responsavel"
            referencedColumns: ["id_responsavel"]
          },
        ]
      }
      trabalhador: {
        Row: {
          ativo: boolean | null
          cpf: string | null
          created_at: string | null
          especialidade: string | null
          id_trabalhador: number
          nome: string
          observacoes: string | null
          pix_chave: string | null
          telefone: string | null
          tipo_vinculo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          especialidade?: string | null
          id_trabalhador?: number
          nome: string
          observacoes?: string | null
          pix_chave?: string | null
          telefone?: string | null
          tipo_vinculo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cpf?: string | null
          created_at?: string | null
          especialidade?: string | null
          id_trabalhador?: number
          nome?: string
          observacoes?: string | null
          pix_chave?: string | null
          telefone?: string | null
          tipo_vinculo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_alocacao_diaria: {
        Row: {
          data_prevista: string | null
          especialidade: string | null
          id_obra: number | null
          id_trabalhador: number | null
          obra: string | null
          situacao: string | null
          status_escala: string | null
          tipo_presenca: string | null
          trabalhador: string | null
          turno: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "escala_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "escala_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "escala_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "escala_id_trabalhador_fkey"
            columns: ["id_trabalhador"]
            isOneToOne: false
            referencedRelation: "trabalhador"
            referencedColumns: ["id_trabalhador"]
          },
        ]
      }
      vw_contas_a_pagar: {
        Row: {
          cnpj: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          dias_para_vencer: number | null
          fornecedor: string | null
          historico: string | null
          id_lancamento: number | null
          id_obra: number | null
          id_parcela: number | null
          numero: number | null
          obra: string | null
          status: string | null
          status_real: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "parcela_id_lancamento_fkey"
            columns: ["id_lancamento"]
            isOneToOne: false
            referencedRelation: "lancamento"
            referencedColumns: ["id_lancamento"]
          },
        ]
      }
      vw_curva_s_financeira: {
        Row: {
          data_competencia: string | null
          id_obra: number | null
          obra: string | null
          tipo: string | null
          total_entrada: number | null
          total_saida: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obra"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_dashboard_obras"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_folha_semanal"
            referencedColumns: ["id_obra"]
          },
          {
            foreignKeyName: "lancamento_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "vw_resumo_pagamento_semanal"
            referencedColumns: ["id_obra"]
          },
        ]
      }
      vw_dashboard_obras: {
        Row: {
          cliente: string | null
          data_fim_prevista: string | null
          data_inicio_prevista: string | null
          id_obra: number | null
          nome: string | null
          pendencias_abertas: number | null
          percentual_finalizada: number | null
          responsavel: string | null
          status: string | null
          tarefas_atrasadas: number | null
          total_planejado: number | null
          total_realizado: number | null
          trabalhadores_ativos: number | null
        }
        Relationships: []
      }
      vw_folha_semanal: {
        Row: {
          data_trabalho: string | null
          especialidade: string | null
          id_obra: number | null
          id_trabalhador: number | null
          obra: string | null
          pix_chave: string | null
          semana: string | null
          tipo_pagamento: string | null
          tipo_presenca: string | null
          trabalhador: string | null
          valor_acordado: number | null
          valor_dia: number | null
        }
        Relationships: [
          {
            foreignKeyName: "presenca_id_trabalhador_fkey"
            columns: ["id_trabalhador"]
            isOneToOne: false
            referencedRelation: "trabalhador"
            referencedColumns: ["id_trabalhador"]
          },
        ]
      }
      vw_resumo_pagamento_semanal: {
        Row: {
          dias_integral: number | null
          dias_meia: number | null
          faltas: number | null
          id_obra: number | null
          id_trabalhador: number | null
          obra: string | null
          pix_chave: string | null
          semana: string | null
          total_a_pagar: number | null
          trabalhador: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presenca_id_trabalhador_fkey"
            columns: ["id_trabalhador"]
            isOneToOne: false
            referencedRelation: "trabalhador"
            referencedColumns: ["id_trabalhador"]
          },
        ]
      }
    }
    Functions: {
      get_user_cliente_id: { Args: never; Returns: number }
      get_user_responsavel_id: { Args: never; Returns: number }
      get_user_role: { Args: never; Returns: string }
      user_can_access_obra: { Args: { obra_id: number }; Returns: boolean }
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
