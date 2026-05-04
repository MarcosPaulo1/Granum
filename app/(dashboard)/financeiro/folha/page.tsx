"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { addDays, eachDayOfInterval, format, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  DollarSign,
  Download,
  Search,
  Users,
} from "lucide-react"
import { toast } from "sonner"

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
import { TIPO_VINCULO } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/utils/format"

const DAYS_LABEL = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface DayCell {
  valor: number
  tipo: string // integral | meia | falta_justificada | falta
}

interface FolhaRow {
  id_trabalhador: number
  trabalhador: string
  especialidade: string | null
  pix_chave: string | null
  tipo_vinculo: string | null
  id_obra: number
  obra: string
  dias: (DayCell | null)[]
  total: number
  presencas: number
}

const VINC_LABEL: Record<string, string> = {
  ...TIPO_VINCULO,
  diaria: "Diária",
  empreitada: "Empreitada",
  mensal: "Mensal",
}

function vincTone(
  v: string | null
): "primary" | "info" | "success" | "warning" | "neutral" {
  if (!v) return "neutral"
  if (v === "diaria" || v === "autonomo") return "info"
  if (v === "empreitada" || v === "empreiteiro") return "warning"
  if (v === "mensal" || v === "clt") return "success"
  if (v === "pj") return "primary"
  return "neutral"
}

export default function FolhaPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [rows, setRows] = useState<FolhaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroObra, setFiltroObra] = useState<"todas" | string>("todas")
  const [busca, setBusca] = useState("")
  const [gerando, setGerando] = useState(false)

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: weekStart,
        end: addDays(weekStart, 5),
      }),
    [weekStart]
  )

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const start = format(weekStart, "yyyy-MM-dd")
    const end = format(addDays(weekStart, 5), "yyyy-MM-dd")

    const { data: diarios } = await supabase
      .from("diario_obra")
      .select("id_diario, data, id_obra")
      .gte("data", start)
      .lte("data", end)

    if (!diarios || diarios.length === 0) {
      setRows([])
      setIsLoading(false)
      return
    }

    const diarioMap = new Map(
      diarios.map((d) => [
        d.id_diario,
        { data: d.data as string, id_obra: d.id_obra },
      ])
    )

    const { data: presencas } = await supabase
      .from("presenca")
      .select("id_trabalhador, id_diario, valor_dia, tipo_presenca")
      .in("id_diario", Array.from(diarioMap.keys()))

    if (!presencas || presencas.length === 0) {
      setRows([])
      setIsLoading(false)
      return
    }

    const trabIds = Array.from(new Set(presencas.map((p) => p.id_trabalhador)))
    const obraIds = Array.from(
      new Set(
        Array.from(diarioMap.values()).map((d) => d.id_obra)
      )
    )

    const [{ data: trabs }, { data: obras }] = await Promise.all([
      supabase
        .from("trabalhador")
        .select("id_trabalhador, nome, especialidade, tipo_vinculo, pix_chave")
        .in("id_trabalhador", trabIds),
      supabase.from("obra").select("id_obra, nome").in("id_obra", obraIds),
    ])

    const trabMap = new Map((trabs ?? []).map((t) => [t.id_trabalhador, t]))
    const obraMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.nome as string])
    )

    // Build matrix: key = id_trab+id_obra → row
    const rowsMap = new Map<string, FolhaRow>()
    for (const p of presencas) {
      const diarioInfo = diarioMap.get(p.id_diario)
      if (!diarioInfo) continue
      const trab = trabMap.get(p.id_trabalhador)
      if (!trab) continue
      const key = `${p.id_trabalhador}-${diarioInfo.id_obra}`
      let row = rowsMap.get(key)
      if (!row) {
        row = {
          id_trabalhador: p.id_trabalhador,
          trabalhador: trab.nome,
          especialidade: trab.especialidade,
          pix_chave: trab.pix_chave,
          tipo_vinculo: trab.tipo_vinculo,
          id_obra: diarioInfo.id_obra,
          obra: obraMap.get(diarioInfo.id_obra) ?? "—",
          dias: Array.from({ length: 6 }, () => null as DayCell | null),
          total: 0,
          presencas: 0,
        }
        rowsMap.set(key, row)
      }

      const dayDate = diarioInfo.data
      const dayIdx = days.findIndex(
        (d) => format(d, "yyyy-MM-dd") === dayDate
      )
      if (dayIdx === -1) continue

      const valor = Number(p.valor_dia ?? 0)
      row.dias[dayIdx] = {
        valor,
        tipo: p.tipo_presenca,
      }
      row.total += valor
      if (p.tipo_presenca === "integral" || p.tipo_presenca === "meia") {
        row.presencas += p.tipo_presenca === "integral" ? 1 : 0.5
      }
    }

    setRows(
      Array.from(rowsMap.values()).sort((a, b) =>
        a.trabalhador.localeCompare(b.trabalhador, "pt-BR")
      )
    )
    setIsLoading(false)
  }, [weekStart, days])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () => Array.from(new Set(rows.map((r) => r.obra).filter(Boolean))).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filtroObra !== "todas" && r.obra !== filtroObra) return false
        if (busca) {
          const q = busca.toLowerCase()
          const haystack = [r.trabalhador, r.especialidade, r.obra]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [rows, filtroObra, busca]
  )

  const totalSemana = rows.reduce((a, r) => a + r.total, 0)
  const totalPorDia = days.map((_, i) =>
    filtered.reduce((a, r) => a + (r.dias[i]?.valor ?? 0), 0)
  )
  const trabAtivos = rows.length
  const totalPresencas = rows.reduce((a, r) => a + r.presencas, 0)

  async function exportCSV() {
    const header = [
      "Trabalhador",
      "Vínculo",
      "Obra",
      ...DAYS_LABEL.map((d, i) => `${d} ${format(days[i], "dd/MM")}`),
      "Total",
      "PIX",
    ].join(",")
    const lines = filtered.map((r) =>
      [
        r.trabalhador,
        r.tipo_vinculo ?? "",
        r.obra,
        ...r.dias.map((d) => d?.valor.toFixed(2) ?? ""),
        r.total.toFixed(2),
        r.pix_chave ?? "",
      ].join(",")
    )
    const csv = [header, ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `folha_${format(weekStart, "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exportado")
  }

  async function gerarLancamentos() {
    if (filtered.length === 0) {
      toast.error("Nenhuma folha para gerar lançamentos")
      return
    }
    setGerando(true)
    const supabase = createClient()

    const { data: plano } = await supabase
      .from("plano_conta")
      .select("id_plano")
      .eq("codigo", "2.2.1")
      .maybeSingle()
    const idPlano = (plano as { id_plano: number } | null)?.id_plano ?? null

    const obraIds = Array.from(new Set(filtered.map((r) => r.id_obra)))
    const { data: obras } = await supabase
      .from("obra")
      .select("id_obra, id_centro_custo")
      .in("id_obra", obraIds)
    const ccMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.id_centro_custo])
    )

    let count = 0
    for (const row of filtered) {
      if (row.total <= 0) continue
      const cc = ccMap.get(row.id_obra)
      if (!cc) continue
      const { error } = await supabase.from("lancamento").insert({
        id_obra: row.id_obra,
        id_centro_custo: cc,
        id_responsavel: 1,
        valor: row.total,
        tipo: "realizado",
        entrada_saida: "saida",
        data_competencia: format(weekStart, "yyyy-MM-dd"),
        historico: `Folha semanal — ${row.trabalhador}`,
        id_plano_conta: idPlano,
      })
      if (!error) count++
    }
    setGerando(false)
    if (count === 0) {
      toast.error("Nenhum lançamento criado (verifique centro de custo das obras)")
    } else {
      toast.success(`${count} lançamento${count === 1 ? "" : "s"} gerado${count === 1 ? "" : "s"}`)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Financeiro · Semana de ${format(weekStart, "dd/MM", { locale: ptBR })} a ${format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: ptBR })}`}
        title="Folha semanal"
        subtitle={`${trabAtivos} trabalhador${trabAtivos === 1 ? "" : "es"} com presença · ${totalPresencas} presença${totalPresencas === 1 ? "" : "s"} registrada${totalPresencas === 1 ? "" : "s"} · fechamento dom ${format(addDays(weekStart, 6), "dd/MM", { locale: ptBR })}`}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={exportCSV}>
              <Download data-icon="inline-start" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              aria-label="Semana anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              aria-label="Próxima semana"
            >
              <ChevronRight />
            </Button>
            <Button
              size="sm"
              onClick={gerarLancamentos}
              disabled={gerando || filtered.length === 0}
            >
              <Check data-icon="inline-start" />
              {gerando ? "Gerando…" : "Gerar lançamentos"}
            </Button>
          </>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          tone="danger"
          label="Total da semana"
          value={formatBRL(totalSemana)}
          sub={`${trabAtivos} trabalhador${trabAtivos === 1 ? "" : "es"} ativo${trabAtivos === 1 ? "" : "s"}`}
          icon={<DollarSign />}
        />
        <KpiCard
          tone="info"
          label="Trabalhadores"
          value={trabAtivos}
          sub="Com presença na semana"
          icon={<Users />}
        />
        <KpiCard
          label="Diárias registradas"
          value={totalPresencas}
          sub={`Sob ${trabAtivos * 6} possíveis`}
          icon={<Clock />}
        />
        <KpiCard
          label="Custo médio dia"
          value={formatBRL(Math.round(totalSemana / 6))}
          sub="6 dias úteis (seg–sáb)"
          icon={<Activity />}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar trabalhador ou especialidade…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filtroObra}
              onChange={(e) => setFiltroObra(e.target.value)}
              className="h-[34px] max-w-[220px] rounded-md border border-border bg-muted px-3 text-[12.5px] text-foreground outline-none focus:border-primary"
            >
              <option value="todas">Todas as obras</option>
              {obras.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="sticky left-0 z-10 min-w-[260px] bg-muted/60 px-5 py-2.5 text-left font-semibold">
                  Trabalhador
                </th>
                <th className="px-5 py-2.5 text-left font-semibold">
                  Vínculo · Obra
                </th>
                {DAYS_LABEL.map((d, i) => (
                  <th
                    key={i}
                    className="min-w-[80px] px-3 py-2.5 text-center font-semibold"
                  >
                    <div>{d}</div>
                    <div className="text-[10px] font-normal text-muted-foreground/70 tabular-nums">
                      {format(days[i], "dd/MM")}
                    </div>
                  </th>
                ))}
                <th className="px-5 py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    Carregando folha…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    {rows.length === 0
                      ? "Nenhum registro de presença na semana selecionada."
                      : "Nenhum trabalhador encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                <>
                  {filtered.map((r) => (
                    <tr
                      key={`${r.id_trabalhador}-${r.id_obra}`}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="sticky left-0 z-10 bg-card px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar variant="pf" name={r.trabalhador} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-medium text-foreground">
                              {r.trabalhador}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">
                              {r.especialidade ?? "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <CategoryChip tone={vincTone(r.tipo_vinculo)}>
                          {VINC_LABEL[r.tipo_vinculo ?? ""] ?? r.tipo_vinculo ?? "—"}
                        </CategoryChip>
                        <div className="mt-1 max-w-[180px] truncate text-[11px] text-muted-foreground">
                          {r.obra}
                        </div>
                      </td>
                      {r.dias.map((d, i) => (
                        <td
                          key={i}
                          className={cn(
                            "px-3 py-3 text-center align-middle",
                            d
                              ? d.tipo === "integral"
                                ? "bg-[var(--success-soft)]/40"
                                : d.tipo === "meia"
                                  ? "bg-[var(--warning-soft)]/40"
                                  : "bg-[var(--danger-soft)]/30"
                              : ""
                          )}
                        >
                          {d ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="mono text-[11px] font-medium tabular-nums text-foreground">
                                {formatBRL(d.valor)}
                              </span>
                              {d.tipo !== "integral" ? (
                                <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
                                  {d.tipo === "meia"
                                    ? "½"
                                    : d.tipo === "falta_justificada"
                                      ? "j"
                                      : "f"}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">·</span>
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-3 text-right">
                        <div className="mono text-[14px] font-semibold tabular-nums text-[var(--danger-ink)]">
                          {formatBRL(r.total)}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground tabular-nums">
                          {r.presencas}/6 dias
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Total row */}
                  <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                    <td className="sticky left-0 z-10 bg-muted/40 px-5 py-3 text-[13px] text-foreground">
                      Total do dia
                    </td>
                    <td className="px-5 py-3 text-[11px] font-normal text-muted-foreground">
                      Soma de presenças
                    </td>
                    {totalPorDia.map((v, i) => (
                      <td key={i} className="px-3 py-3 text-center">
                        <span className="mono text-[12.5px] font-semibold tabular-nums text-[var(--danger-ink)]">
                          {formatBRL(v)}
                        </span>
                      </td>
                    ))}
                    <td className="px-5 py-3 text-right">
                      <div className="mono text-[15px] font-bold tabular-nums text-[var(--danger-ink)]">
                        {formatBRL(filtered.reduce((a, r) => a + r.total, 0))}
                      </div>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
