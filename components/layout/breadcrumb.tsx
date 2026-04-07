"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

const ROUTE_LABELS: Record<string, string> = {
  obras: "Obras",
  clientes: "Clientes",
  fornecedores: "Fornecedores",
  responsaveis: "Responsáveis",
  trabalhadores: "Trabalhadores",
  contratos: "Contratos",
  financeiro: "Financeiro",
  lancamentos: "Lançamentos",
  contas: "Contas a pagar",
  "plano-contas": "Plano de contas",
  folha: "Folha de pagamento",
  dashboards: "Relatórios",
  alocacao: "Painel de alocação",
  configuracoes: "Configurações",
  integracoes: "Integrações",
  tarefas: "Tarefas",
  equipe: "Equipe",
  diarios: "Diários",
  documentos: "Documentos",
  novo: "Novo",
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const crumbs = segments
    .map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/")
      const isId = /^\d+$/.test(segment) || segment.startsWith("[")
      const label = isId ? `#${segment}` : ROUTE_LABELS[segment] || segment

      return { label, href, isLast: index === segments.length - 1 }
    })
    .filter((crumb) => crumb.label !== "(dashboard)")

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link
        href="/obras"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
