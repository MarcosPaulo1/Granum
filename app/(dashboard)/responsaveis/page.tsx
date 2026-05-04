"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  DollarSign,
  Download,
  Hammer,
  Layout,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { ResponsavelForm } from "@/components/forms/responsavel-form"
import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/shared/segmented-control"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROLES, type Role } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils/format"

interface ResponsavelRow {
  id_responsavel: number
  nome: string
  cargo: string | null
  departamento: string | null
  email: string | null
  telefone: string | null
  ativo: boolean | null
  data_admissao: string | null
  perfil_codigo: Role | string
}

const PERFIL_TONE: Record<
  Role | "outro",
  "primary" | "info" | "success" | "warning" | "neutral"
> = {
  diretor: "primary",
  arquiteta: "info",
  engenheiro: "success",
  mestre_obra: "warning",
  financeiro: "neutral",
  outro: "neutral",
}

function perfilLabel(codigo: string): string {
  return (ROLES as Record<string, string>)[codigo] ?? codigo
}

function perfilTone(codigo: string) {
  return (PERFIL_TONE as Record<string, "primary" | "info" | "success" | "warning" | "neutral">)[codigo] ?? "neutral"
}

function responsavelCode(id: number) {
  return `RSP-${String(id).padStart(3, "0")}`
}

const STATUS_OPTIONS: SegmentedOption<"todos" | "ativos" | "inativos">[] = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
]

export default function ResponsaveisPage() {
  const router = useRouter()
  const [rows, setRows] = useState<ResponsavelRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroPerfil, setFiltroPerfil] = useState<"todos" | string>("todos")
  const [filtroDepto, setFiltroDepto] = useState<"todos" | string>("todos")
  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | "ativos" | "inativos">("todos")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: resps, error } = await supabase
      .from("responsavel")
      .select(
        "id_responsavel, nome, cargo, departamento, email, telefone, ativo, data_admissao, id_perfil"
      )
      .order("nome")

    if (error) {
      toast.error("Erro ao carregar responsáveis: " + error.message)
      setIsLoading(false)
      return
    }

    const { data: perfis } = await supabase
      .from("perfil")
      .select("id_perfil, nome")

    const perfilMap = new Map((perfis ?? []).map((p) => [p.id_perfil, p.nome]))

    setRows(
      (resps ?? []).map((r) => ({
        id_responsavel: r.id_responsavel,
        nome: r.nome,
        cargo: r.cargo,
        departamento: r.departamento,
        email: r.email,
        telefone: r.telefone,
        ativo: r.ativo,
        data_admissao: r.data_admissao,
        perfil_codigo: perfilMap.get(r.id_perfil) ?? "outro",
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const departamentos = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.departamento).filter(Boolean) as string[])
      ).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filtroPerfil !== "todos" && r.perfil_codigo !== filtroPerfil)
          return false
        if (filtroDepto !== "todos" && r.departamento !== filtroDepto)
          return false
        if (filtroStatus === "ativos" && r.ativo === false) return false
        if (filtroStatus === "inativos" && r.ativo !== false) return false
        if (busca) {
          const q = busca.toLowerCase()
          const haystack = [r.nome, r.email, r.cargo, r.departamento]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [rows, filtroPerfil, filtroDepto, filtroStatus, busca]
  )

  const ativos = rows.filter((r) => r.ativo !== false)
  const ativosCount = ativos.length
  const byPerfil = (codigo: string) =>
    ativos.filter((r) => r.perfil_codigo === codigo).length

  const diretoria = byPerfil("diretor")
  const arquitetura = byPerfil("arquiteta")
  const execucao = byPerfil("engenheiro") + byPerfil("mestre_obra")
  const financeiro = byPerfil("financeiro")

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastros · Equipe interna"
        title="Responsáveis"
        subtitle={`${rows.length} pessoa${rows.length === 1 ? "" : "s"} cadastrada${rows.length === 1 ? "" : "s"} · ${ativosCount} ativa${ativosCount === 1 ? "" : "s"} · ${departamentos.length} departamento${departamentos.length === 1 ? "" : "s"}`}
        actions={
          <>
            <Button variant="outline" size="sm" disabled>
              <Download data-icon="inline-start" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus data-icon="inline-start" />
              Novo responsável
            </Button>
          </>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          tone="primary"
          label="Diretoria"
          value={diretoria}
          sub="Acesso total ao sistema"
          icon={<Briefcase />}
        />
        <KpiCard
          tone="info"
          label="Arquitetura"
          value={arquitetura}
          sub="Projetos e desenhos"
          icon={<Layout />}
        />
        <KpiCard
          tone="success"
          label="Execução"
          value={execucao}
          sub="Engenheiros e mestres"
          icon={<Hammer />}
        />
        <KpiCard
          label="Financeiro"
          value={financeiro}
          sub="Lançamentos e pagamentos"
          icon={<DollarSign />}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, cargo ou e-mail…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filtroPerfil}
              onChange={(e) => setFiltroPerfil(e.target.value)}
              className="h-[34px] rounded-md border border-border bg-muted px-3 text-[12.5px] text-foreground outline-none focus:border-primary"
            >
              <option value="todos">Todos perfis</option>
              {Object.entries(ROLES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={filtroDepto}
              onChange={(e) => setFiltroDepto(e.target.value)}
              className="h-[34px] rounded-md border border-border bg-muted px-3 text-[12.5px] text-foreground outline-none focus:border-primary"
            >
              <option value="todos">Todos departamentos</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <SegmentedControl
              value={filtroStatus}
              onValueChange={setFiltroStatus}
              options={STATUS_OPTIONS}
              ariaLabel="Filtro de status"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-semibold">Nome</th>
                <th className="px-5 py-2.5 text-left font-semibold">
                  Cargo · Depto
                </th>
                <th className="px-5 py-2.5 text-left font-semibold">Contato</th>
                <th className="px-5 py-2.5 text-left font-semibold">Perfil</th>
                <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                <th className="w-12 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    Carregando responsáveis…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    {rows.length === 0
                      ? "Nenhum responsável cadastrado ainda."
                      : "Nenhum responsável encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const ativo = r.ativo !== false
                  return (
                    <tr
                      key={r.id_responsavel}
                      className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
                      onClick={() =>
                        router.push(`/responsaveis/${r.id_responsavel}`)
                      }
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar variant="pf" name={r.nome} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-medium text-foreground">
                              {r.nome}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground tabular-nums">
                              {responsavelCode(r.id_responsavel)}
                              {r.data_admissao
                                ? ` · Admissão ${formatDate(r.data_admissao)}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-medium text-foreground">
                          {r.cargo ?? <span className="text-muted-foreground">—</span>}
                        </div>
                        {r.departamento ? (
                          <div className="text-[11.5px] text-muted-foreground">
                            {r.departamento}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[12.5px] text-foreground">
                          {r.email ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        {r.telefone ? (
                          <div className="mono mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
                            {r.telefone}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <CategoryChip tone={perfilTone(r.perfil_codigo)}>
                          {perfilLabel(r.perfil_codigo)}
                        </CategoryChip>
                      </td>
                      <td className="px-5 py-3">
                        {ativo ? (
                          <CategoryChip tone="success">
                            <span className="size-1.5 rounded-full bg-[var(--success)]" />
                            Ativo
                          </CategoryChip>
                        ) : (
                          <CategoryChip tone="neutral">
                            <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                            Inativo
                          </CategoryChip>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Mais ações"
                        >
                          <MoreHorizontal />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[12.5px] text-muted-foreground">
          <span>
            Mostrando {filtered.length} de {rows.length} responsáve
            {rows.length === 1 ? "l" : "is"}
          </span>
        </div>
      </div>

      <ResponsavelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </div>
  )
}
