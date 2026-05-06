export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      pacientes: {
        Row: {
          id: string
          nome: string
          data_nascimento: string | null
          cpf: string | null
          rg: string | null
          telefone: string
          email: string | null
          endereco: string | null
          profissao: string | null
          responsavel: string | null
          plano_odontologico: string | null
          numero_carteirinha: string | null
          tem_alergia: boolean
          descricao_alergia: string | null
          usa_medicamento: boolean
          descricao_medicamento: string | null
          tem_doenca_sistemica: boolean
          descricao_doenca: string | null
          observacoes_clinicas: string | null
          link_anamnese_pdf: string | null
          status: 'Ativo' | 'Inativo' | 'Bloqueado'
          novo_paciente: boolean
          data_cadastro: string
          data_ultima_consulta: string | null
          total_consultas: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pacientes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pacientes']['Insert']>
      }
      consultas: {
        Row: {
          id: string
          paciente_id: string | null
          paciente_nome: string
          paciente_telefone: string | null
          data_consulta: string
          data_fim_consulta: string | null
          procedimento: string | null
          observacoes: string | null
          evento_google_id: string | null
          canal_agendamento: string
          data_agendamento: string
          status: 'Agendado' | 'Confirmado' | 'Remarcado' | 'Cancelado' | 'Realizado' | 'Faltou'
          confirmacao_enviada: boolean
          confirmacao_resposta: string | null
          valor_cobrado: number | null
          forma_pagamento: string | null
          nota_fiscal_emitida: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['consultas']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['consultas']['Insert']>
      }
      notas_fiscais: {
        Row: {
          id: string
          numero_nf: string | null
          numero_rps: string | null
          paciente_id: string | null
          paciente_nome: string
          paciente_cpf: string | null
          consulta_id: string | null
          descricao_servico: string
          codigo_servico: string
          valor_servicos: number
          valor_deducoes: number | null
          valor_iss: number | null
          aliquota_iss: number
          valor_liquido: number | null
          link_pdf: string | null
          enviado_whatsapp: boolean
          enviado_email: boolean
          status: 'Pendente' | 'Emitida' | 'Cancelada' | 'Erro'
          data_emissao: string
          mes_competencia: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notas_fiscais']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notas_fiscais']['Insert']>
      }
      historico_mensagens: {
        Row: {
          id: string
          telefone: string
          paciente_id: string | null
          message_id: string | null
          direcao: 'recebida' | 'enviada'
          texto: string | null
          tipo_mensagem: string
          intencao_detectada: string | null
          workflow_acionado: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['historico_mensagens']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['historico_mensagens']['Insert']>
      }
      conteudo_postado: {
        Row: {
          id: string
          tema: string
          tipo_conteudo: string | null
          legenda_instagram: string | null
          texto_story_whatsapp: string | null
          hashtags: string[] | null
          call_to_action: string | null
          instagram_post_id: string | null
          publicado_instagram: boolean
          publicado_instagram_em: string | null
          publicado_story: boolean
          instagram_likes: number
          instagram_comentarios: number
          link_midia: string | null
          legenda: string | null
          curtidas: number | null
          comentarios: number | null
          data_postagem: string | null
          data_post: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['conteudo_postado']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['conteudo_postado']['Insert']>
      }
      documentos: {
        Row: {
          id: string
          tipo: 'prescricao' | 'laudo' | 'anamnese'
          numero_documento: string | null
          paciente_id: string | null
          paciente_nome: string | null
          paciente_cpf: string | null
          consulta_id: string | null
          html_gerado: string | null
          conteudo_texto: string | null
          link_pdf: string | null
          enviado_whatsapp: boolean
          status: 'Gerado' | 'Enviado' | 'Erro'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['documentos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['documentos']['Insert']>
      }
    }
    Views: {
      vw_consultas_semana: {
        Row: {
          id: string
          paciente_nome: string
          paciente_telefone: string | null
          data_consulta: string
          procedimento: string | null
          status: string
          confirmacao_enviada: boolean
          confirmacao_resposta: string | null
          valor_cobrado: number | null
          paciente_email: string | null
          plano_odontologico: string | null
        }
      }
      vw_financeiro_mes: {
        Row: {
          mes: string
          total_nfs: number
          faturamento_bruto: number
          total_iss: number
          faturamento_liquido: number
        }
      }
    }
  }
}

export type Paciente        = Database['public']['Tables']['pacientes']['Row']
export type Consulta        = Database['public']['Tables']['consultas']['Row']
export type NotaFiscal      = Database['public']['Tables']['notas_fiscais']['Row']
export type Mensagem        = Database['public']['Tables']['historico_mensagens']['Row']
export type ConteudoPostado = Database['public']['Tables']['conteudo_postado']['Row']
export type Documento       = Database['public']['Tables']['documentos']['Row']
export type PostSocial      = ConteudoPostado
