"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { endOfWeek, format, startOfWeek } from "date-fns"
import {
  Download,
  HardHat,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { TrabalhadorForm } from "@/components/forms/trabalhador-form"
import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { PresenceWeek } from "@/components/shared/presence-week"
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/shared/segmented-control"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ESPECIALIDADE, TIPO_VINCULO } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatCPF } from "@/lib/utils/format"

interface TrabRow {
  id_trabalhador: number
  nome: string
  cpf: string | null
  especialidade: string | null
  tipo_vinculo: string | null
  telefone: string | null
  pix_chave: string | null
  ativo: boolean | null
  presencaSem: number
}

const VINCULO_OPTIONS: SegmentedOption<"todos" | string>[] = [
  { value: "todos", label: "Todos vínculos" },
  { value: "autonomo", label: "Autônomo" },
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
  { value: "empreiteiro", label: "Empreiteiro" },
]

const STATUS_OPTIONS: SegmentedOption<"todos" | "ativos" | "inativos">[] = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
]

const VINCULO_TONE: Record<
  string,
  "primary" | "info" | "success" | "warning" | "neutral"
> = {
  autonomo: "info",
  clt: "success",
  pj: "primary",
  empreiteiro: "warning",
}

function trabalhadorCode(id: number) {
  return `TRB-${String(id).padStart(4, "0")}`
}

function vinculoLabel(v: string | null): string {
  if (!v) return "—"
  return (
    (TIPO_VINCULO as Record<string, string>)[v] ??
    v[0].toUpperCase() + v.slice(1)
  )
}

function especialidadeLabel(e: string | null): string {
  if (!e) return "—"
  return (
    (ESPECIALIDADE as Record<string, string>)[e] ??
    e[0].toUpperCase() + e.slice(1)
  )
}

export default function TrabalhadoresPage() {
  const router = useRouter()
  const [rows, setRows] = useState<TrabRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroEsp, setFiltroEsp] = useState<"todas" | string>("todas")
  const [filtroVinc, setFiltroVinc] = useState<"todos" | string>("todos")
  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | "ativos" | "inativos">("todos")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: trabs, error } = await supabase
      .from("trabalhador")
      .select("*")
      .order("nome")

    if (error) {
      toast.error("Erro ao carregar trabalhadores: " + error.message)
      setIsLoading(false)
      return
    }

    // Presença da semana corrente: distinct dias por trabalhador via presenca → diario
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    const { data: diarios } = await supabase
      .from("diario_obra")
      .select("id_diario, data")
      .gte("data", format(weekStart, "yyyy-MM-dd"))
      .lte("data", format(weekEnd, "yyyy-MM-dd"))

    const presencasPorTrab = new Map<number, Set<string>>()

    if (diarios && diarios.length > 0) {
      const diarioMap = new Map(
        diarios.map((d) => [d.id_diario, d.data as string])
      )
      const diarioIds = Array.from(diarioMap.keys())

      const { data: presencas } = await supabase
        .from("presenca")
        .select("id_trabalhador, id_diario")
        .in("id_diario", diarioIds)

      for (const p of presencas ?? []) {
        const data = diarioMap.get(p.id_diario)
        if (!data) continue
        const set = presencasPorTrab.get(p.id_trabalhador) ?? new Set<string>()
        set.add(data)
        presencasPorTrab.set(p.id_trabalhador, set)
      }
    }

    setRows(
      (trabs ?? []).map((t) => ({
        ...t,
        presencaSem: presencasPorTrab.get(t.id_trabalhador)?.size ?? 0,
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const especialidades = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.especialidade).filter(Boolean) as string[])
      ).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((t) => {
        if (filtroEsp !== "todas" && t.especialidade !== filtroEsp) return false
        if (filtroVinc !== "todos" && t.tipo_vinculo !== filtroVinc) return false
        if (filtroStatus === "ativos" && t.ativo === false) return false
        if (filtroStatus === "inativos" && t.ativo !== false) return false
        if (busca) {
          const q = busca.toLowerCase()
          const haystack = [t.nome, t.cpf, t.telefone, t.especialidade]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [rows, filtroEsp, filtroVinc, filtroStatus, busca]
  )

  const total = rows.length
  const ativosCount = rows.filter((r) => r.ativo !== false).length
  const trabalhandoSemana = rows.filter((r) => r.presencaSem > 0).length
  const presencaMedia =
    ativosCount === 0
      ? 0
      : Math.round(
          (rows.reduce((a, r) => a + (r.ativo === false ? 0 : r.presencaSem), 0) /
            (ativosCount * 6)) *
            100
        )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastros · Equipe de campo"
        title="Trabalhadores"
        subtitle={`${total} cadastrado${total === 1 ? "" : "s"} · ${ativosCount} ativo${ativosCount === 1 ? "" : "s"} · ${trabalhandoSemana} com presença esta semana`}
        actions={
          <>
            <Button variant="ghost" size="sm" disabled>
              <Upload data-icon="inline-start" />
              Importar
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download data-icon="inline-start" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus data-icon="inline-start" />
              Novo trabalhador
            </Button>
          </>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          label="Total cadastrados"
          value={total}
          sub={`${ativosCount} ativos · ${total - ativosCount} inativos`}
          icon={<Users />}
        />
        <KpiCard
          tone="info"
          label="Trabalhando esta semana"
          value={trabalhandoSemana}
          sub={`${ativosCount ? Math.round((trabalhandoSemana * 100) / ativosCount) : 0}% dos ativos`}
          icon={<HardHat />}
        />
        <KpiCard
          tone={presencaMedia >= 80 ? "success" : presencaMedia >= 50 ? "warning" : "danger"}
          label="Presença média"
          value={`${presencaMedia}%`}
          sub="Sob 6 dias úteis"
          icon={<TrendingUp />}
        />
        <KpiCard
          label="Especialidades"
          value={especialidades.length}
          sub={`${especialidades.slice(0, 2).map(especialidadeLabel).join(", ")}${especialidades.length > 2 ? "…" : ""}`}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, CPF…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filtroEsp}
              onChange={(e) => setFiltroEsp(e.target.value)}
              className="h-[34px] rounded-md border border-border bg-muted px-3 text-[12.5px] text-foreground outline-none focus:border-primary"
            >
              <option value="todas">Todas especialidades</option>
              {especialidades.map((e) => (
                <option key={e} value={e}>
                  {especialidadeLabel(e)}
                </option>
              ))}
            </select>
            <SegmentedControl
              value={filtroVinc}
              onValueChange={setFiltroVinc}
              options={VINCULO_OPTIONS}
              ariaLabel="Vínculo"
            />
            <SegmentedControl
              value={filtroStatus}
              onValueChange={setFiltroStatus}
              options={STATUS_OPTIONS}
              ariaLabel="Status"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-semibold">Trabalhador</th>
                <th className="px-5 py-2.5 text-left font-semibold">CPF · Pix</th>
                <th className="px-5 py-2.5 text-left font-semibold">Especialidade</th>
                <th className="px-5 py-2.5 text-left font-semibold">Vínculo</th>
                <th className="px-5 py-2.5 text-left font-semibold">Presença semana</th>
                <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                <th className="w-12 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    Carregando trabalhadores…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    {rows.length === 0
                      ? "Nenhum trabalhador cadastrado ainda."
                      : "Nenhum trabalhador encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const ativo = t.ativo !== false
                  const vinculoTone =
                    VINCULO_TONE[t.tipo_vinculo ?? ""] ?? "neutral"
                  return (
                    <tr
                      key={t.id_trabalhador}
                      className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
                      onClick={() =>
                        router.push(`/trabalhadores/${t.id_trabalhador}`)
                      }
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar variant="pf" name={t.nome} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-medium text-foreground">
                              {t.nome}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground tabular-nums">
                              {trabalhadorCode(t.id_trabalhador)}
                              {t.telefone ? ` · ${t.telefone}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="mono text-[12.5px] text-foreground tabular-nums">
                          {t.cpf ? formatCPF(t.cpf) : "—"}
                        </div>
                        {t.pix_chave ? (
                          <div className="mono mt-0.5 max-w-[180px] truncate text-[11.5px] text-muted-foreground">
                            pix: {t.pix_chave}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-medium text-foreground">
                          {especialidadeLabel(t.especialidade)}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {t.tipo_vinculo ? (
                          <CategoryChip tone={vinculoTone}>
                            {vinculoLabel(t.tipo_vinculo)}
                          </CategoryChip>
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <PresenceWeek
                          present={t.presencaSem}
                          total={6}
                          showCount
                        />
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
            Mostrando {filtered.length} de {total} trabalhador
            {total !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      <TrabalhadorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </div>
  )
}
