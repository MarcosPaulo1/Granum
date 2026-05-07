"use client"

// Sidebar + Header — port literal de granum-design/chrome.jsx
// Wireado com auth real do Supabase + role-based filtering

import Image from "next/image"
import Link from "next/link"
import { Fragment, type ReactNode } from "react"
import { usePathname } from "next/navigation"

import { Icon } from "@/components/granum/icon"
import type { Role } from "@/lib/constants"

interface NavItem {
  id: string
  label: string
  icon: string
  href: string
  count?: number
  roles: Role[]
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

const ALL_ROLES: Role[] = [
  "diretor",
  "engenheiro",
  "financeiro",
  "arquiteta",
  "mestre_obra",
]

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "home",
        href: "/dashboards/geral",
        roles: ALL_ROLES,
      },
      {
        id: "obras",
        label: "Obras",
        icon: "building",
        href: "/obras",
        roles: ALL_ROLES,
      },
    ],
  },
  {
    label: "Cadastros",
    items: [
      {
        id: "clientes",
        label: "Clientes",
        icon: "users",
        href: "/clientes",
        roles: ["diretor", "arquiteta", "financeiro"],
      },
      {
        id: "fornecedores",
        label: "Fornecedores",
        icon: "truck",
        href: "/fornecedores",
        roles: ["diretor", "financeiro"],
      },
      {
        id: "trabalhadores",
        label: "Trabalhadores",
        icon: "hammer",
        href: "/trabalhadores",
        roles: ["diretor", "engenheiro", "financeiro", "mestre_obra"],
      },
      {
        id: "responsaveis",
        label: "Responsáveis",
        icon: "briefcase",
        href: "/responsaveis",
        roles: ["diretor"],
      },
    ],
  },
  {
    label: "Financeiro",
    items: [
      {
        id: "lancamentos",
        label: "Lançamentos",
        icon: "dollar",
        href: "/financeiro/lancamentos",
        roles: ["diretor", "financeiro"],
      },
      {
        id: "contas",
        label: "Contas a pagar",
        icon: "receipt",
        href: "/financeiro/contas",
        roles: ["diretor", "financeiro"],
      },
      {
        id: "plano",
        label: "Plano de contas",
        icon: "tree",
        href: "/financeiro/plano-contas",
        roles: ["diretor", "financeiro"],
      },
      {
        id: "folha",
        label: "Folha semanal",
        icon: "calendar",
        href: "/financeiro/folha",
        roles: ["diretor", "financeiro"],
      },
    ],
  },
  {
    label: "Relatórios",
    items: [
      {
        id: "dashFin",
        label: "Dashboard financeiro",
        icon: "chart",
        href: "/dashboards/financeiro",
        roles: ["diretor", "financeiro"],
      },
      {
        id: "alocacao",
        label: "Alocação de equipe",
        icon: "layout",
        href: "/dashboards/alocacao",
        roles: ["diretor", "engenheiro"],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        id: "config",
        label: "Configurações",
        icon: "settings",
        href: "/configuracoes",
        roles: ["diretor"],
      },
      {
        id: "integra",
        label: "Integrações",
        icon: "plug",
        href: "/integracoes",
        roles: ["diretor"],
      },
    ],
  },
]

interface SidebarProps {
  role: Role | null
  userName: string
  roleName: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Sidebar({ role, userName, roleName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Image
          src="/granum-simbolo-branco.png"
          alt="Granum"
          width={28}
          height={28}
        />
        <span className="wordmark">granum</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((g, gi) => {
          const visibleItems = g.items.filter(
            (it) => role && it.roles.includes(role)
          )
          if (visibleItems.length === 0) return null
          return (
            <div className="sidebar-group" key={gi}>
              {g.label ? (
                <div className="sidebar-group-label">{g.label}</div>
              ) : null}
              {visibleItems.map((it) => {
                const isActive =
                  pathname === it.href ||
                  (it.href !== "/" && pathname.startsWith(it.href))
                return (
                  <Link
                    key={it.id}
                    href={it.href}
                    className={"sidebar-item" + (isActive ? " active" : "")}
                  >
                    <Icon name={it.icon} />
                    <span>{it.label}</span>
                    {it.count != null ? (
                      <span className="count">{it.count}</span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
      <Link href="/perfil" className="sidebar-user">
        <div className="avatar">{getInitials(userName)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name">{userName}</div>
          <div className="role">{roleName}</div>
        </div>
        <div
          className="icon-btn"
          style={{ color: "rgba(244,238,228,0.55)" }}
          aria-hidden
        >
          <Icon name="chevronRight" />
        </div>
      </Link>
    </aside>
  )
}

export interface Crumb {
  label: ReactNode
  href?: string
}

interface HeaderProps {
  crumbs?: Crumb[]
  /** Conteúdo extra à direita (ex: botão sair). Se omitido usa as ações default (busca + sino). */
  actions?: ReactNode
  onSignOut?: () => void
}

export function Header({ crumbs = [], actions, onSignOut }: HeaderProps) {
  return (
    <header className="header">
      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 ? (
              <Icon
                name="chevronRight"
                className="sep"
                style={{ width: 12, height: 12 }}
              />
            ) : null}
            {i === crumbs.length - 1 ? (
              <span className="current">{c.label}</span>
            ) : c.href ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span>{c.label}</span>
            )}
          </Fragment>
        ))}
      </div>
      <div className="header-actions">
        {actions ?? (
          <>
            <button type="button" className="icon-btn" aria-label="Buscar">
              <Icon name="search" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Notificações"
            >
              <Icon name="bell" />
              <span className="dot" />
            </button>
            {onSignOut ? (
              <button
                type="button"
                className="icon-btn"
                aria-label="Sair"
                onClick={onSignOut}
              >
                <Icon name="logout" />
              </button>
            ) : null}
          </>
        )}
      </div>
    </header>
  )
}
