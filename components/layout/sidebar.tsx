"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/constants"
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  HardHat,
  UserCog,
  Building,
  DollarSign,
  Receipt,
  CreditCard,
  TreePine,
  FileSpreadsheet,
  BarChart3,
  CalendarDays,
  Settings,
  Link2,
  Building2,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
  children?: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/obras",
    icon: LayoutDashboard,
    roles: ["diretor", "engenheiro", "financeiro", "arquiteta", "mestre_obra"],
  },
  {
    label: "Obras",
    href: "/obras",
    icon: ClipboardList,
    roles: ["diretor", "engenheiro", "financeiro", "arquiteta", "mestre_obra"],
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
    roles: ["diretor", "arquiteta", "financeiro"],
  },
  {
    label: "Trabalhadores",
    href: "/trabalhadores",
    icon: HardHat,
    roles: ["diretor", "engenheiro", "financeiro", "mestre_obra"],
  },
  {
    label: "Responsáveis",
    href: "/responsaveis",
    icon: UserCog,
    roles: ["diretor"],
  },
  {
    label: "Fornecedores",
    href: "/fornecedores",
    icon: Building,
    roles: ["diretor", "financeiro"],
  },
  {
    label: "Financeiro",
    href: "/financeiro/lancamentos",
    icon: DollarSign,
    roles: ["diretor", "financeiro"],
    children: [
      {
        label: "Lançamentos",
        href: "/financeiro/lancamentos",
        icon: Receipt,
        roles: ["diretor", "financeiro"],
      },
      {
        label: "Contas a pagar",
        href: "/financeiro/contas",
        icon: CreditCard,
        roles: ["diretor", "financeiro"],
      },
      {
        label: "Plano de contas",
        href: "/financeiro/plano-contas",
        icon: TreePine,
        roles: ["diretor", "financeiro"],
      },
      {
        label: "Folha de pagamento",
        href: "/financeiro/folha",
        icon: FileSpreadsheet,
        roles: ["diretor", "financeiro"],
      },
    ],
  },
  {
    label: "Relatórios",
    href: "/dashboards/geral",
    icon: BarChart3,
    roles: ["diretor", "financeiro", "engenheiro"],
    children: [
      {
        label: "Visão geral",
        href: "/dashboards/geral",
        icon: LayoutDashboard,
        roles: ["diretor", "financeiro"],
      },
      {
        label: "Dashboard financeiro",
        href: "/dashboards/financeiro",
        icon: BarChart3,
        roles: ["diretor", "financeiro"],
      },
      {
        label: "Painel de alocação",
        href: "/dashboards/alocacao",
        icon: CalendarDays,
        roles: ["diretor", "engenheiro"],
      },
    ],
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    roles: ["diretor"],
  },
  {
    label: "Integrações",
    href: "/integracoes",
    icon: Link2,
    roles: ["diretor"],
  },
]

interface SidebarProps {
  role: Role | null
  userName: string
  roleName: string
  onSignOut: () => void
}

export function Sidebar({ role, userName, roleName, onSignOut }: SidebarProps) {
  const pathname = usePathname()

  const filteredItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  )

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-lg">Gestão de Obras</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {filteredItems.map((item) => (
            <li key={item.href + item.label}>
              {item.children ? (
                <SidebarGroup item={item} pathname={pathname} role={role} />
              ) : (
                <SidebarLink item={item} pathname={pathname} />
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t p-4">
        <div className="mb-2">
          <p className="text-sm font-medium truncate">{userName}</p>
          <p className="text-xs text-muted-foreground">{roleName}</p>
        </div>
        <button
          onClick={onSignOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  )
}

function SidebarGroup({
  item,
  pathname,
  role,
}: {
  item: NavItem
  pathname: string
  role: Role | null
}) {
  const isGroupActive = item.children?.some((child) =>
    pathname.startsWith(child.href)
  )
  const Icon = item.icon

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
          isGroupActive
            ? "text-blue-700 font-medium"
            : "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </div>
      <ul className="ml-7 space-y-1">
        {item.children
          ?.filter((child) => role && child.roles.includes(role))
          .map((child) => (
            <li key={child.href}>
              <SidebarLink item={child} pathname={pathname} />
            </li>
          ))}
      </ul>
    </div>
  )
}
