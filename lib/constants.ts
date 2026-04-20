export const OBRA_STATUS = {
  planejamento: { label: "Planejamento", color: "bg-gray-100 text-gray-700" },
  em_andamento: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  pausada: { label: "Pausada", color: "bg-yellow-100 text-yellow-700" },
  concluida: { label: "Concluída", color: "bg-green-100 text-green-700" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700" },
} as const

export const TAREFA_STATUS = {
  pendente: { label: "Pendente", color: "bg-gray-100 text-gray-700" },
  em_andamento: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  concluida: { label: "Concluída", color: "bg-green-100 text-green-700" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  bloqueada: { label: "Bloqueada", color: "bg-orange-100 text-orange-700" },
} as const

export const CONTRATO_STATUS = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-700" },
  pausado: { label: "Pausado", color: "bg-yellow-100 text-yellow-700" },
  encerrado: { label: "Encerrado", color: "bg-gray-100 text-gray-700" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700" },
} as const

export const PARCELA_STATUS = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  pago: { label: "Pago", color: "bg-green-100 text-green-700" },
  atrasado: { label: "Atrasado", color: "bg-red-100 text-red-700" },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-700" },
} as const

export const DIARIO_REVISAO = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  aprovado: { label: "Aprovado", color: "bg-green-100 text-green-700" },
  rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-700" },
} as const

export const DIARIO_ORIGEM = {
  manual: { label: "Manual", color: "bg-gray-100 text-gray-700" },
  whatsapp: { label: "WhatsApp", color: "bg-green-100 text-green-700" },
  plaud: { label: "Plaud", color: "bg-purple-100 text-purple-700" },
} as const

export const PRESENCA_TIPO = {
  integral: { label: "Integral", color: "bg-green-500 text-white" },
  meia: { label: "Meia", color: "bg-green-300 text-green-900" },
  falta: { label: "Falta", color: "bg-red-500 text-white" },
  falta_justificada: { label: "Falta justificada", color: "bg-yellow-500 text-yellow-900" },
} as const

export const ESCALA_STATUS = {
  planejado: { label: "Planejado", color: "bg-blue-400 text-white" },
  confirmado: { label: "Confirmado", color: "bg-blue-700 text-white" },
  cancelado: { label: "Cancelado", color: "bg-gray-300 text-gray-600 line-through" },
} as const

export const TURNO = {
  integral: "Integral",
  manha: "Manhã",
  tarde: "Tarde",
} as const

export const TIPO_PAGAMENTO = {
  diaria: "Diária",
  empreitada: "Empreitada",
  hora: "Hora",
  metro_quadrado: "Metro quadrado",
} as const

export const TIPO_VINCULO = {
  autonomo: "Autônomo",
  pj: "PJ",
  clt: "CLT",
  empreiteiro: "Empreiteiro",
} as const

export const ESPECIALIDADE = {
  pedreiro: "Pedreiro",
  eletricista: "Eletricista",
  encanador: "Encanador",
  pintor: "Pintor",
  servente: "Servente",
  mestre: "Mestre",
  carpinteiro: "Carpinteiro",
  serralheiro: "Serralheiro",
} as const

export const LANCAMENTO_TIPO = {
  planejado: { label: "Planejado", color: "bg-blue-100 text-blue-700" },
  realizado: { label: "Realizado", color: "bg-green-100 text-green-700" },
} as const

export const ENTRADA_SAIDA = {
  entrada: { label: "Entrada", color: "text-green-600" },
  saida: { label: "Saída", color: "text-red-600" },
} as const

export const DOCUMENTO_TIPO = {
  projeto: { label: "Projeto", color: "bg-blue-100 text-blue-700" },
  foto: { label: "Foto", color: "bg-purple-100 text-purple-700" },
  transcricao: { label: "Transcrição", color: "bg-orange-100 text-orange-700" },
  orcamento: { label: "Orçamento", color: "bg-green-100 text-green-700" },
  relatorio: { label: "Relatório", color: "bg-cyan-100 text-cyan-700" },
  contrato: { label: "Contrato", color: "bg-yellow-100 text-yellow-700" },
  inspecao: { label: "Inspeção", color: "bg-amber-100 text-amber-700" },
  outro: { label: "Outro", color: "bg-gray-100 text-gray-700" },
} as const

export const PENDENCIA_STATUS = {
  aberta: { label: "Aberta", color: "bg-red-100 text-red-700" },
  em_correcao: { label: "Em correção", color: "bg-yellow-100 text-yellow-700" },
  resolvida: { label: "Resolvida", color: "bg-green-100 text-green-700" },
  aprovada_cliente: { label: "Aprovada", color: "bg-blue-100 text-blue-700" },
} as const

export const PENDENCIA_PRIORIDADE = {
  alta: { label: "Alta", color: "bg-red-100 text-red-700" },
  media: { label: "Média", color: "bg-yellow-100 text-yellow-700" },
  baixa: { label: "Baixa", color: "bg-gray-100 text-gray-700" },
} as const

export const INSPECAO_TIPO = {
  seguranca: { label: "Segurança", color: "bg-orange-100 text-orange-700" },
  qualidade: { label: "Qualidade", color: "bg-blue-100 text-blue-700" },
  recebimento_material: { label: "Recebimento", color: "bg-cyan-100 text-cyan-700" },
  vistoria_cliente: { label: "Vistoria cliente", color: "bg-purple-100 text-purple-700" },
} as const

export const INSPECAO_STATUS = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  conforme: { label: "Conforme", color: "bg-green-100 text-green-700" },
  nao_conforme: { label: "Não conforme", color: "bg-red-100 text-red-700" },
  parcial: { label: "Parcial", color: "bg-orange-100 text-orange-700" },
} as const

export const ALTERACAO_STATUS = {
  proposta: { label: "Proposta", color: "bg-gray-100 text-gray-700" },
  aprovada_interna: { label: "Aprovada interna", color: "bg-blue-100 text-blue-700" },
  aprovada_cliente: { label: "Aprovada cliente", color: "bg-green-100 text-green-700" },
  rejeitada: { label: "Rejeitada", color: "bg-red-100 text-red-700" },
  cancelada: { label: "Cancelada", color: "bg-gray-100 text-gray-700" },
} as const

export const ORCAMENTO_STATUS = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-700" },
  apresentado: { label: "Apresentado", color: "bg-blue-100 text-blue-700" },
  aprovado: { label: "Aprovado", color: "bg-green-100 text-green-700" },
  rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-700" },
  substituido: { label: "Substituído", color: "bg-orange-100 text-orange-700" },
} as const

export type Role = "diretor" | "engenheiro" | "financeiro" | "arquiteta" | "mestre_obra"

export const ROLES: Record<Role, string> = {
  diretor: "Diretor",
  engenheiro: "Engenheiro",
  financeiro: "Financeiro",
  arquiteta: "Arquiteta",
  mestre_obra: "Mestre de Obra",
}
