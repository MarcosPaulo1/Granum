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
      perfil: {
        Row: {
          id_perfil: number
          nome: string
          permissoes: Json
          descricao: string | null
        }
        Insert: {
          id_perfil?: number
          nome: string
          permissoes?: Json
          descricao?: string | null
        }
        Update: {
          id_perfil?: number
          nome?: string
          permissoes?: Json
          descricao?: string | null
        }
      }
      cliente: {
        Row: {
          id_cliente: number
          nome: string
          cpf_cnpj: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id_cliente?: number
          nome: string
          cpf_cnpj?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id_cliente?: number
          nome?: string
          cpf_cnpj?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      responsavel: {
        Row: {
          id_responsavel: number
          auth_user_id: string | null
          id_perfil: number
          nome: string
          telefone: string | null
          telefone_whatsapp: string | null
          email: string | null
          departamento: string | null
          cargo: string | null
          data_admissao: string | null
          data_desligamento: string | null
          observacoes: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id_responsavel?: number
          auth_user_id?: string | null
          id_perfil: number
          nome: string
          telefone?: string | null
          telefone_whatsapp?: string | null
          email?: string | null
          departamento?: string | null
          cargo?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id_responsavel?: number
          auth_user_id?: string | null
          id_perfil?: number
          nome?: string
          telefone?: string | null
          telefone_whatsapp?: string | null
          email?: string | null
          departamento?: string | null
          cargo?: string | null
          data_admissao?: string | null
          data_desligamento?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      fornecedor: {
        Row: {
          id_fornecedor: number
          cnpj: string | null
          nome: string
          email: string | null
          contato: string | null
          tipo: string | null
          observacoes: string | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id_fornecedor?: number
          cnpj?: string | null
          nome: string
          email?: string | null
          contato?: string | null
          tipo?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id_fornecedor?: number
          cnpj?: string | null
          nome?: string
          email?: string | null
          contato?: string | null
          tipo?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
        }
      }
      centro_custo: {
        Row: {
          id_centro_custo: number
          codigo: string
          nome: string
          descricao: string | null
          ativo: boolean
        }
        Insert: {
          id_centro_custo?: number
          codigo: string
          nome: string
          descricao?: string | null
          ativo?: boolean
        }
        Update: {
          id_centro_custo?: number
          codigo?: string
          nome?: string
          descricao?: string | null
          ativo?: boolean
        }
      }
      plano_conta: {
        Row: {
          id_plano: number
          codigo: string | null
          nome: string
          id_pai: number | null
          tipo_plano: "receita" | "despesa" | null
          analitica: boolean
        }
        Insert: {
          id_plano?: number
          codigo?: string | null
          nome: string
          id_pai?: number | null
          tipo_plano?: "receita" | "despesa" | null
          analitica?: boolean
        }
        Update: {
          id_plano?: number
          codigo?: string | null
          nome?: string
          id_pai?: number | null
          tipo_plano?: "receita" | "despesa" | null
          analitica?: boolean
        }
      }
      grupo_movimento: {
        Row: {
          id_grupo: number
          nome: string
          descricao: string | null
        }
        Insert: {
          id_grupo?: number
          nome: string
          descricao?: string | null
        }
        Update: {
          id_grupo?: number
          nome?: string
          descricao?: string | null
        }
      }
      etapa: {
        Row: {
          id_etapa: number
          codigo: string
          nome: string
          descricao: string | null
          ordem: number
        }
        Insert: {
          id_etapa?: number
          codigo: string
          nome: string
          descricao?: string | null
          ordem?: number
        }
        Update: {
          id_etapa?: number
          codigo?: string
          nome?: string
          descricao?: string | null
          ordem?: number
        }
      }
      trabalhador: {
        Row: {
          id_trabalhador: number
          nome: string
          cpf: string | null
          telefone: string | null
          especialidade: string | null
          tipo_vinculo: string | null
          pix_chave: string | null
          observacoes: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id_trabalhador?: number
          nome: string
          cpf?: string | null
          telefone?: string | null
          especialidade?: string | null
          tipo_vinculo?: string | null
          pix_chave?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id_trabalhador?: number
          nome?: string
          cpf?: string | null
          telefone?: string | null
          especialidade?: string | null
          tipo_vinculo?: string | null
          pix_chave?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      obra: {
        Row: {
          id_obra: number
          id_cliente: number
          id_centro_custo: number | null
          id_responsavel: number | null
          nome: string
          data_inicio_prevista: string | null
          data_fim_prevista: string | null
          data_inicio_real: string | null
          data_fim_real: string | null
          descricao: string | null
          endereco: string | null
          status: "planejamento" | "em_andamento" | "pausada" | "concluida" | "cancelada"
          percentual_finalizada: number
          created_at: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          id_obra?: number
          id_cliente: number
          id_centro_custo?: number | null
          id_responsavel?: number | null
          nome: string
          data_inicio_prevista?: string | null
          data_fim_prevista?: string | null
          data_inicio_real?: string | null
          data_fim_real?: string | null
          descricao?: string | null
          endereco?: string | null
          status?: "planejamento" | "em_andamento" | "pausada" | "concluida" | "cancelada"
          percentual_finalizada?: number
          created_at?: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          id_obra?: number
          id_cliente?: number
          id_centro_custo?: number | null
          id_responsavel?: number | null
          nome?: string
          data_inicio_prevista?: string | null
          data_fim_prevista?: string | null
          data_inicio_real?: string | null
          data_fim_real?: string | null
          descricao?: string | null
          endereco?: string | null
          status?: "planejamento" | "em_andamento" | "pausada" | "concluida" | "cancelada"
          percentual_finalizada?: number
          created_at?: string
          updated_at?: string
          updated_by?: number | null
        }
      }
      tarefa: {
        Row: {
          id_tarefa: number
          id_obra: number
          id_etapa: number | null
          id_responsavel: number | null
          nome: string
          descricao: string | null
          data_inicio: string | null
          data_fim: string | null
          conclusao_real: string | null
          status: "pendente" | "em_andamento" | "concluida" | "cancelada" | "bloqueada"
          percentual_concluido: number
          orcamento_previsto: number
          ordem: number
          created_at: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          id_tarefa?: number
          id_obra: number
          id_etapa?: number | null
          id_responsavel?: number | null
          nome: string
          descricao?: string | null
          data_inicio?: string | null
          data_fim?: string | null
          conclusao_real?: string | null
          status?: "pendente" | "em_andamento" | "concluida" | "cancelada" | "bloqueada"
          percentual_concluido?: number
          orcamento_previsto?: number
          ordem?: number
          created_at?: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          id_tarefa?: number
          id_obra?: number
          id_etapa?: number | null
          id_responsavel?: number | null
          nome?: string
          descricao?: string | null
          data_inicio?: string | null
          data_fim?: string | null
          conclusao_real?: string | null
          status?: "pendente" | "em_andamento" | "concluida" | "cancelada" | "bloqueada"
          percentual_concluido?: number
          orcamento_previsto?: number
          ordem?: number
          created_at?: string
          updated_at?: string
          updated_by?: number | null
        }
      }
      lancamento: {
        Row: {
          id_lancamento: number
          id_obra: number
          id_tarefa: number | null
          id_grupo_movimento: number | null
          id_centro_custo: number
          id_plano_conta: number | null
          id_fornecedor: number | null
          id_responsavel: number
          historico: string | null
          valor: number
          tipo: "planejado" | "realizado"
          entrada_saida: "entrada" | "saida"
          forma_pagamento: string | null
          data_pagamento: string | null
          data_competencia: string
          created_at: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          id_lancamento?: number
          id_obra: number
          id_tarefa?: number | null
          id_grupo_movimento?: number | null
          id_centro_custo: number
          id_plano_conta?: number | null
          id_fornecedor?: number | null
          id_responsavel: number
          historico?: string | null
          valor: number
          tipo: "planejado" | "realizado"
          entrada_saida: "entrada" | "saida"
          forma_pagamento?: string | null
          data_pagamento?: string | null
          data_competencia: string
          created_at?: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          id_lancamento?: number
          id_obra?: number
          id_tarefa?: number | null
          id_grupo_movimento?: number | null
          id_centro_custo?: number
          id_plano_conta?: number | null
          id_fornecedor?: number | null
          id_responsavel?: number
          historico?: string | null
          valor?: number
          tipo?: "planejado" | "realizado"
          entrada_saida?: "entrada" | "saida"
          forma_pagamento?: string | null
          data_pagamento?: string | null
          data_competencia?: string
          created_at?: string
          updated_at?: string
          updated_by?: number | null
        }
      }
      parcela: {
        Row: {
          id_parcela: number
          id_lancamento: number
          numero: number
          valor: number
          data_vencimento: string
          data_pagamento: string | null
          status: "pendente" | "pago" | "atrasado" | "cancelado"
        }
        Insert: {
          id_parcela?: number
          id_lancamento: number
          numero: number
          valor: number
          data_vencimento: string
          data_pagamento?: string | null
          status?: "pendente" | "pago" | "atrasado" | "cancelado"
        }
        Update: {
          id_parcela?: number
          id_lancamento?: number
          numero?: number
          valor?: number
          data_vencimento?: string
          data_pagamento?: string | null
          status?: "pendente" | "pago" | "atrasado" | "cancelado"
        }
      }
      documento: {
        Row: {
          id_documento: number
          id_obra: number
          id_responsavel: number | null
          tipo: "projeto" | "foto" | "transcricao" | "orcamento" | "relatorio" | "contrato" | "outro"
          nome: string
          url_sharepoint: string | null
          data_criacao: string
        }
        Insert: {
          id_documento?: number
          id_obra: number
          id_responsavel?: number | null
          tipo: "projeto" | "foto" | "transcricao" | "orcamento" | "relatorio" | "contrato" | "outro"
          nome: string
          url_sharepoint?: string | null
          data_criacao?: string
        }
        Update: {
          id_documento?: number
          id_obra?: number
          id_responsavel?: number | null
          tipo?: "projeto" | "foto" | "transcricao" | "orcamento" | "relatorio" | "contrato" | "outro"
          nome?: string
          url_sharepoint?: string | null
          data_criacao?: string
        }
      }
      diario_obra: {
        Row: {
          id_diario: number
          id_obra: number
          id_responsavel: number | null
          data: string
          conteudo: string | null
          origem: "manual" | "whatsapp" | "plaud"
          status_revisao: "pendente" | "aprovado" | "rejeitado"
          created_at: string
        }
        Insert: {
          id_diario?: number
          id_obra: number
          id_responsavel?: number | null
          data: string
          conteudo?: string | null
          origem?: "manual" | "whatsapp" | "plaud"
          status_revisao?: "pendente" | "aprovado" | "rejeitado"
          created_at?: string
        }
        Update: {
          id_diario?: number
          id_obra?: number
          id_responsavel?: number | null
          data?: string
          conteudo?: string | null
          origem?: "manual" | "whatsapp" | "plaud"
          status_revisao?: "pendente" | "aprovado" | "rejeitado"
          created_at?: string
        }
      }
      contrato_trabalho: {
        Row: {
          id_contrato: number
          id_trabalhador: number
          id_obra: number
          id_tarefa: number | null
          tipo_pagamento: "diaria" | "empreitada" | "hora" | "metro_quadrado"
          valor_acordado: number
          unidade_valor: string
          data_inicio: string
          data_fim: string | null
          status: "ativo" | "pausado" | "encerrado" | "cancelado"
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id_contrato?: number
          id_trabalhador: number
          id_obra: number
          id_tarefa?: number | null
          tipo_pagamento: "diaria" | "empreitada" | "hora" | "metro_quadrado"
          valor_acordado: number
          unidade_valor?: string
          data_inicio: string
          data_fim?: string | null
          status?: "ativo" | "pausado" | "encerrado" | "cancelado"
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id_contrato?: number
          id_trabalhador?: number
          id_obra?: number
          id_tarefa?: number | null
          tipo_pagamento?: "diaria" | "empreitada" | "hora" | "metro_quadrado"
          valor_acordado?: number
          unidade_valor?: string
          data_inicio?: string
          data_fim?: string | null
          status?: "ativo" | "pausado" | "encerrado" | "cancelado"
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      escala: {
        Row: {
          id_escala: number
          id_obra: number
          id_trabalhador: number
          id_contrato: number
          data_prevista: string
          turno: "integral" | "manha" | "tarde"
          status: "planejado" | "confirmado" | "cancelado"
        }
        Insert: {
          id_escala?: number
          id_obra: number
          id_trabalhador: number
          id_contrato: number
          data_prevista: string
          turno?: "integral" | "manha" | "tarde"
          status?: "planejado" | "confirmado" | "cancelado"
        }
        Update: {
          id_escala?: number
          id_obra?: number
          id_trabalhador?: number
          id_contrato?: number
          data_prevista?: string
          turno?: "integral" | "manha" | "tarde"
          status?: "planejado" | "confirmado" | "cancelado"
        }
      }
      presenca: {
        Row: {
          id_presenca: number
          id_diario: number
          id_trabalhador: number
          id_contrato: number
          tipo_presenca: "integral" | "meia" | "falta" | "falta_justificada"
          horas_trabalhadas: number | null
          valor_dia: number | null
          observacoes: string | null
        }
        Insert: {
          id_presenca?: number
          id_diario: number
          id_trabalhador: number
          id_contrato: number
          tipo_presenca: "integral" | "meia" | "falta" | "falta_justificada"
          horas_trabalhadas?: number | null
          valor_dia?: number | null
          observacoes?: string | null
        }
        Update: {
          id_presenca?: number
          id_diario?: number
          id_trabalhador?: number
          id_contrato?: number
          tipo_presenca?: "integral" | "meia" | "falta" | "falta_justificada"
          horas_trabalhadas?: number | null
          valor_dia?: number | null
          observacoes?: string | null
        }
      }
    }
    Views: {
      vw_folha_semanal: {
        Row: {
          id_trabalhador: number
          trabalhador: string
          especialidade: string | null
          pix_chave: string | null
          id_obra: number
          obra: string
          tipo_pagamento: string
          valor_acordado: number
          data_trabalho: string
          tipo_presenca: string
          valor_dia: number | null
          semana: string
        }
      }
      vw_alocacao_diaria: {
        Row: {
          id_obra: number
          obra: string
          data_prevista: string
          id_trabalhador: number
          trabalhador: string
          especialidade: string | null
          turno: string
          status_escala: string
          tipo_presenca: string | null
          situacao: string
        }
      }
      vw_curva_s_financeira: {
        Row: {
          id_obra: number
          obra: string
          data_competencia: string
          tipo: string
          total_saida: number
          total_entrada: number
        }
      }
      vw_contas_a_pagar: {
        Row: {
          id_parcela: number
          id_lancamento: number
          numero: number
          valor: number
          data_vencimento: string
          status: string
          data_pagamento: string | null
          historico: string | null
          id_obra: number
          fornecedor: string | null
          cnpj: string | null
          obra: string
          status_real: string
          dias_para_vencer: number
        }
      }
      vw_resumo_pagamento_semanal: {
        Row: {
          semana: string
          id_trabalhador: number
          trabalhador: string
          pix_chave: string | null
          id_obra: number
          obra: string
          dias_integral: number
          dias_meia: number
          faltas: number
          total_a_pagar: number
        }
      }
    }
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_responsavel_id: {
        Args: Record<string, never>
        Returns: number
      }
      user_can_access_obra: {
        Args: { obra_id: number }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
