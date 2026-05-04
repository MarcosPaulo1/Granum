"use client"

import Image from "next/image"
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
  LogOut,
  User,
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
    href: "/dashboards/geral",
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
  {
    label: "Meu perfil",
    href: "/perfil",
    icon: User,
    roles: ["diretor", "engenheiro", "financeiro", "arquiteta", "mestre_obra"],
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
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <Image
          src="/granum-logo-branco.png"
          alt="Granum"
          width={128}
          height={32}
          className="h-7 w-auto"
          priority
        />
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
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

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-2">
          <p className="text-sm font-medium truncate text-sidebar-foreground">{userName}</p>
          <p className="text-xs text-sidebar-foreground/60">{roleName}</p>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
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
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-sidebar-primary"
        />
      )}
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
    <div className="mt-2">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold",
          isGroupActive
            ? "text-sidebar-foreground/90"
            : "text-sidebar-foreground/50"
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {item.label}
      </div>
      <ul className="space-y-0.5">
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
