import type { Role } from "@/lib/constants"

type Permission =
  | "ver_todas_obras"
  | "criar_obra"
  | "editar_obra"
  | "ver_lancamentos"
  | "criar_lancamento"
  | "criar_tarefa"
  | "registrar_diario"
  | "aprovar_diario"
  | "registrar_presenca"
  | "ver_folha"
  | "aprovar_folha"
  | "gerenciar_cadastros"
  | "configuracoes"
  | "montar_escala"
  | "gerenciar_documentos"
  | "dashboard_financeiro"
  | "painel_alocacao"

const PERMISSIONS_MAP: Record<Permission, Role[]> = {
  ver_todas_obras: ["diretor", "financeiro", "arquiteta"],
  criar_obra: ["diretor", "arquiteta"],
  editar_obra: ["diretor", "engenheiro"],
  ver_lancamentos: ["diretor", "financeiro"],
  criar_lancamento: ["diretor", "financeiro"],
  criar_tarefa: ["diretor", "engenheiro"],
  registrar_diario: ["diretor", "engenheiro", "mestre_obra"],
  aprovar_diario: ["diretor"],
  registrar_presenca: ["diretor", "engenheiro", "mestre_obra"],
  ver_folha: ["diretor", "financeiro"],
  aprovar_folha: ["diretor", "financeiro"],
  gerenciar_cadastros: ["diretor"],
  configuracoes: ["diretor"],
  montar_escala: ["diretor", "engenheiro"],
  gerenciar_documentos: ["diretor", "engenheiro", "arquiteta"],
  dashboard_financeiro: ["diretor", "financeiro"],
  painel_alocacao: ["diretor", "engenheiro"],
}

export function hasPermission(role: Role | null, permission: Permission): boolean {
  if (!role) return false
  return PERMISSIONS_MAP[permission].includes(role)
}

export function canAccessRoute(role: Role | null, pathname: string): boolean {
  if (!role) return false
  if (role === "diretor") return true

  const routePermissions: Record<string, Role[]> = {
    "/obras": ["diretor", "engenheiro", "financeiro", "arquiteta", "mestre_obra"],
    "/clientes": ["diretor", "arquiteta", "financeiro"],
    "/fornecedores": ["diretor", "financeiro"],
    "/responsaveis": ["diretor"],
    "/trabalhadores": ["diretor", "engenheiro", "financeiro", "mestre_obra"],
    "/financeiro": ["diretor", "financeiro"],
    "/dashboards/financeiro": ["diretor", "financeiro"],
    "/dashboards/alocacao": ["diretor", "engenheiro"],
    "/configuracoes": ["diretor"],
    "/integracoes": ["diretor"],
  }

  for (const [route, roles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route)) {
      return roles.includes(role)
    }
  }

  return true
}
