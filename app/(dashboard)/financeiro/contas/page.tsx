"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/shared/segmented-control"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/utils/format"

interface ContaRow {
  id_parcela: number
  id_lancamento: number
  numero: number
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  dias_para_vencer: number
  status: string
  status_real: string
  historico: string | null
  obra: string
  fornecedor: string | null
  cnpj: string | null
}

const JANELA_OPTIONS: SegmentedOption<
  "todas" | "atrasadas" | "hoje" | "semana" | "mes"
>[] = [
  { value: "todas", label: "Todas" },
  { value: "atrasadas", label: "Atrasadas" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "7 dias" },
  { value: "mes", label: "30 dias" },
]

function parcelaCode(id: number) {
  return `PRC-${String(id).padStart(4, "0")}`
}

function isInWindow(
  diff: number,
  janela: "todas" | "atrasadas" | "hoje" | "semana" | "mes",
  status: string
) {
  if (janela === "todas") return true
  if (janela === "atrasadas") return status === "atrasado" || diff < 0
  if (janela === "hoje") return diff === 0
  if (janela === "semana") return diff >= 0 && diff <= 7
  if (janela === "mes") return diff >= 0 && diff <= 30
  return true
}

export default function ContasPage() {
  const [data, setData] = useState<ContaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroJanela, setFiltroJanela] = useState<
    "todas" | "atrasadas" | "hoje" | "semana" | "mes"
  >("todas")
  const [filtroObra, setFiltroObra] = useState<"todas" | string>("todas")
  const [busca, setBusca] = useState("")
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [pagandoIds, setPagandoIds] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: contas, error } = await supabase
      .from("vw_contas_a_pagar")
      .select("*")
      .order("data_vencimento")

    if (error) {
      toast.error("Erro ao carregar contas: " + error.message)
      setIsLoading(false)
      return
    }
    setData(
      (contas ?? []).map((c) => ({
        id_parcela: c.id_parcela ?? 0,
        id_lancamento: c.id_lancamento ?? 0,
        numero: c.numero ?? 0,
        valor: Number(c.valor ?? 0),
        data_vencimento: c.data_vencimento ?? "",
        data_pagamento: c.data_pagamento,
        dias_para_vencer: c.dias_para_vencer ?? 0,
        status: c.status ?? "pendente",
        status_real: c.status_real ?? "pendente",
        historico: c.historico,
        obra: c.obra ?? "—",
        fornecedor: c.fornecedor,
        cnpj: c.cnpj,
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () =>
      Array.from(new Set(data.map((d) => d.obra).filter(Boolean))).sort(),
    [data]
  )

  const filtered = useMemo(
    () =>
      data.filter((c) => {
        // só mostra abertas (status !== pago) por padrão
        if (c.status === "pago") return false
        if (!isInWindow(c.dias_para_vencer, filtroJanela, c.status_real))
          return false
        if (filtroObra !== "todas" && c.obra !== filtroObra) return false
        if (busca) {
          const q = busca.toLowerCase()
          const haystack = [
            c.historico,
            c.fornecedor,
            c.cnpj,
            c.obra,
            String(c.id_parcela),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [data, filtroJanela, filtroObra, busca]
  )

  const atrasadas = data.filter(
    (c) => c.status !== "pago" && c.dias_para_vencer < 0
  )
  const hoje = data.filter(
    (c) => c.status !== "pago" && c.dias_para_vencer === 0
  )
  const semana = data.filter(
    (c) =>
      c.status !== "pago" && c.dias_para_vencer >= 0 && c.dias_para_vencer <= 7
  )
  const mes = data.filter(
    (c) =>
      c.status !== "pago" && c.dias_para_vencer >= -90 && c.dias_para_vencer <= 30
  )

  const totalAtrasadas = atrasadas.reduce((a, c) => a + c.valor, 0)
  const totalHoje = hoje.reduce((a, c) => a + c.valor, 0)
  const totalSemana = semana.reduce((a, c) => a + c.valor, 0)
  const total30 = mes.reduce((a, c) => a + c.valor, 0)

  const toggle = (id: number) => {
    setSel((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }
  const toggleAll = () => {
    if (sel.size === filtered.length && filtered.length > 0) {
      setSel(new Set())
    } else {
      setSel(new Set(filtered.map((c) => c.id_parcela)))
    }
  }

  const selValor = filtered
    .filter((c) => sel.has(c.id_parcela))
    .reduce((a, c) => a + c.valor, 0)

  async function marcarPago(ids: number[]) {
    if (ids.length === 0) return
    setPagandoIds((p) => {
      const next = new Set(p)
      for (const id of ids) next.add(id)
      return next
    })
    const supabase = createClient()
    const today = format(new Date(), "yyyy-MM-dd")
    const { error } = await supabase
      .from("parcela")
      .update({ status: "pago", data_pagamento: today })
      .in("id_parcela", ids)

    setPagandoIds((p) => {
      const next = new Set(p)
      for (const id of ids) next.delete(id)
      return next
    })

    if (error) {
      toast.error("Erro ao marcar como pago: " + error.message)
      return
    }
    toast.success(
      ids.length === 1 ? "Parcela marcada como paga" : `${ids.length} parcelas marcadas como pagas`
    )
    setSel(new Set())
    load()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Financeiro · Referência ${format(new Date(), "dd/MM/yyyy")}`}
        title="Contas a pagar"
        subtitle={
          <>
            {filtered.length} conta{filtered.length === 1 ? "" : "s"} em aberto · próximos 30 dias totalizam{" "}
            <strong className="text-foreground">{formatBRL(total30)}</strong>
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" disabled>
              <Download data-icon="inline-start" />
              Exportar
            </Button>
            <Button size="sm" disabled>
              <Plus data-icon="inline-start" />
              Nova conta
            </Button>
          </>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          tone="danger"
          label="Atrasadas"
          value={formatBRL(totalAtrasadas)}
          sub={`${atrasadas.length} conta${atrasadas.length === 1 ? "" : "s"} em atraso`}
          icon={<AlertTriangle />}
        />
        <KpiCard
          tone="warning"
          label="Vencem hoje"
          value={formatBRL(totalHoje)}
          sub={`${hoje.length} conta${hoje.length === 1 ? "" : "s"} para hoje`}
          icon={<Clock />}
        />
        <KpiCard
          label="Próximos 7 dias"
          value={formatBRL(totalSemana)}
          sub={`${semana.length} a vencer`}
          icon={<Calendar />}
        />
        <KpiCard
          label="Próximos 30 dias"
          value={formatBRL(total30)}
          sub="Previsão de saída de caixa"
          icon={<TrendingUp />}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por descrição, fornecedor…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              value={filtroJanela}
              onValueChange={setFiltroJanela}
              options={JANELA_OPTIONS}
              ariaLabel="Janela"
            />
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

        {sel.size > 0 ? (
          <div className="flex items-center justify-between border-b border-border bg-accent px-5 py-2.5 text-[13px]">
            <div>
              <strong className="text-foreground">{sel.size}</strong> conta
              {sel.size > 1 ? "s" : ""} selecionada{sel.size > 1 ? "s" : ""} ·{" "}
              <span className="mono font-medium tabular-nums text-foreground">
                {formatBRL(selValor)}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSel(new Set())}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => marcarPago(Array.from(sel))}
                disabled={pagandoIds.size > 0}
              >
                <Check data-icon="inline-start" />
                Marcar como pagas
              </Button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-3 py-2.5 text-left font-semibold">
                  <input
                    type="checkbox"
                    checked={sel.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    aria-label="Selecionar todas"
                    className="size-4 rounded border-border accent-primary"
                  />
                </th>
                <th className="px-5 py-2.5 text-left font-semibold">Vencimento</th>
                <th className="px-5 py-2.5 text-left font-semibold">Descrição</th>
                <th className="px-5 py-2.5 text-left font-semibold">Obra</th>
                <th className="px-5 py-2.5 text-left font-semibold">Fornecedor</th>
                <th className="px-5 py-2.5 text-right font-semibold">Valor</th>
                <th className="w-32 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    Carregando contas…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    {data.filter((c) => c.status !== "pago").length === 0
                      ? "Nenhuma conta em aberto. 🎉"
                      : "Nenhuma conta encontrada com esses filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isAtrasado =
                    c.status_real === "atrasado" || c.dias_para_vencer < 0
                  const isHoje = c.dias_para_vencer === 0
                  const isSelected = sel.has(c.id_parcela)
                  return (
                    <tr
                      key={c.id_parcela}
                      className={cn(
                        "border-b border-border last:border-b-0 transition-colors",
                        isAtrasado && "bg-[var(--danger-soft)]/30",
                        isSelected && "bg-accent",
                        !isAtrasado && !isSelected && "hover:bg-muted/40"
                      )}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(c.id_parcela)}
                          aria-label={`Selecionar conta ${c.id_parcela}`}
                          className="size-4 rounded border-border accent-primary"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[13px] font-medium text-foreground tabular-nums">
                          {format(parseISO(c.data_vencimento), "dd/MM/yyyy")}
                        </div>
                        <div className="mt-0.5">
                          {isAtrasado ? (
                            <CategoryChip tone="danger">
                              <span className="size-1.5 rounded-full bg-destructive" />
                              {Math.abs(c.dias_para_vencer)}d em atraso
                            </CategoryChip>
                          ) : isHoje ? (
                            <CategoryChip tone="warning">
                              <span className="size-1.5 rounded-full bg-[var(--warning)]" />
                              Vence hoje
                            </CategoryChip>
                          ) : (
                            <span className="text-[11.5px] text-muted-foreground">
                              em {c.dias_para_vencer}d
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="max-w-[280px] truncate text-[13.5px] font-medium text-foreground">
                          {c.historico ?? "(sem descrição)"}
                        </div>
                        <div className="mono mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
                          {parcelaCode(c.id_parcela)}
                          {c.numero > 1 ? ` · ${c.numero}ª parcela` : ""}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="max-w-[200px] truncate text-[12.5px] text-foreground">
                          {c.obra}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="max-w-[200px] truncate text-[13px] text-foreground">
                          {c.fornecedor ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        {c.cnpj ? (
                          <div className="mono mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
                            {c.cnpj}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="mono text-[14px] font-semibold tabular-nums text-[var(--danger-ink)]">
                          {formatBRL(c.valor)}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => marcarPago([c.id_parcela])}
                            disabled={pagandoIds.has(c.id_parcela)}
                          >
                            {pagandoIds.has(c.id_parcela) ? "..." : "Pagar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Mais ações"
                          >
                            <MoreHorizontal />
                          </Button>
                        </div>
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
            Mostrando {filtered.length} de{" "}
            {data.filter((c) => c.status !== "pago").length} conta
            {data.filter((c) => c.status !== "pago").length !== 1 ? "s" : ""} em
            aberto · total{" "}
            <span className="mono font-medium text-foreground">
              {formatBRL(filtered.reduce((a, c) => a + c.valor, 0))}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
