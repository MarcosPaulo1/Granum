"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { LancamentoForm } from "@/components/forms/lancamento-form"
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

interface LancRow {
  id_lancamento: number
  data_competencia: string
  data_pagamento: string | null
  entrada_saida: string
  valor: number
  tipo: string
  historico: string | null
  forma_pagamento: string | null
  id_obra: number
  id_fornecedor: number | null
  id_centro_custo: number
  obra_nome: string
  fornecedor_nome: string
  centro_custo_nome: string
  status: "pago" | "pendente" | "atrasado"
}

const FORMA_LABEL: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  ted: "TED",
  doc: "DOC",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
}

const TIPO_OPTIONS: SegmentedOption<"todos" | "entrada" | "saida">[] = [
  { value: "todos", label: "Todos" },
  { value: "entrada", label: "Entradas" },
  { value: "saida", label: "Saídas" },
]

const STATUS_OPTIONS: SegmentedOption<
  "todos" | "pago" | "pendente" | "atrasado"
>[] = [
  { value: "todos", label: "Todos" },
  { value: "pago", label: "Pagos" },
  { value: "pendente", label: "Pendentes" },
  { value: "atrasado", label: "Atrasados" },
]

function lancCode(id: number) {
  return `LN-${String(id).padStart(4, "0")}`
}

function deriveStatus(
  dataPagamento: string | null,
  dataCompetencia: string,
  hoje: string
): "pago" | "pendente" | "atrasado" {
  if (dataPagamento) return "pago"
  if (dataCompetencia < hoje) return "atrasado"
  return "pendente"
}

function categoriaTone(
  centroCusto: string
): "info" | "success" | "warning" | "neutral" | "primary" {
  const lower = centroCusto.toLowerCase()
  if (
    lower.includes("material") ||
    lower.includes("estrutura") ||
    lower.includes("acabamento")
  )
    return "info"
  if (lower.includes("medi") || lower.includes("faturamento")) return "success"
  if (
    lower.includes("mão") ||
    lower.includes("mao") ||
    lower.includes("loca") ||
    lower.includes("servi") ||
    lower.includes("emprei")
  )
    return "warning"
  if (lower.includes("admin") || lower.includes("oper")) return "primary"
  return "neutral"
}

export default function LancamentosPage() {
  const [data, setData] = useState<LancRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] =
    useState<"todos" | "entrada" | "saida">("todos")
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "pago" | "pendente" | "atrasado"
  >("todos")
  const [filtroObra, setFiltroObra] = useState<"todas" | string>("todas")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: lancs, error } = await supabase
      .from("lancamento")
      .select("*")
      .order("data_competencia", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar lançamentos: " + error.message)
      setIsLoading(false)
      return
    }

    const list = lancs ?? []
    const obraIds = Array.from(new Set(list.map((l) => l.id_obra)))
    const fornIds = Array.from(
      new Set(list.filter((l) => l.id_fornecedor).map((l) => l.id_fornecedor!))
    )
    const ccIds = Array.from(new Set(list.map((l) => l.id_centro_custo)))

    const [obrasRes, fornsRes, ccsRes] = await Promise.all([
      obraIds.length
        ? supabase
            .from("obra")
            .select("id_obra, nome")
            .in("id_obra", obraIds)
        : Promise.resolve({ data: [] as { id_obra: number; nome: string }[] }),
      fornIds.length
        ? supabase
            .from("fornecedor")
            .select("id_fornecedor, nome")
            .in("id_fornecedor", fornIds)
        : Promise.resolve({
            data: [] as { id_fornecedor: number; nome: string }[],
          }),
      ccIds.length
        ? supabase
            .from("centro_custo")
            .select("id_centro_custo, nome")
            .in("id_centro_custo", ccIds)
        : Promise.resolve({
            data: [] as { id_centro_custo: number; nome: string }[],
          }),
    ])

    const obraMap = new Map(
      (obrasRes.data ?? []).map((o) => [o.id_obra, o.nome])
    )
    const fornMap = new Map(
      (fornsRes.data ?? []).map((f) => [f.id_fornecedor, f.nome])
    )
    const ccMap = new Map(
      (ccsRes.data ?? []).map((c) => [c.id_centro_custo, c.nome])
    )

    const hoje = format(new Date(), "yyyy-MM-dd")

    setData(
      list.map((l) => ({
        ...l,
        obra_nome: obraMap.get(l.id_obra) ?? "—",
        fornecedor_nome: l.id_fornecedor
          ? fornMap.get(l.id_fornecedor) ?? ""
          : "",
        centro_custo_nome: ccMap.get(l.id_centro_custo) ?? "",
        status: deriveStatus(l.data_pagamento, l.data_competencia, hoje),
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () =>
      Array.from(
        new Set(data.map((d) => d.obra_nome).filter((n) => n && n !== "—"))
      ).sort(),
    [data]
  )

  const filtered = useMemo(
    () =>
      data.filter((l) => {
        if (filtroTipo !== "todos" && l.entrada_saida !== filtroTipo)
          return false
        if (filtroStatus !== "todos" && l.status !== filtroStatus) return false
        if (filtroObra !== "todas" && l.obra_nome !== filtroObra) return false
        if (busca) {
          const q = busca.toLowerCase()
          const haystack = [
            l.historico,
            l.fornecedor_nome,
            l.obra_nome,
            l.centro_custo_nome,
            String(l.id_lancamento),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [data, filtroTipo, filtroStatus, filtroObra, busca]
  )

  const entradasPagas = data
    .filter((l) => l.entrada_saida === "entrada" && l.status === "pago")
    .reduce((a, l) => a + Number(l.valor), 0)
  const saidasPagas = data
    .filter((l) => l.entrada_saida === "saida" && l.status === "pago")
    .reduce((a, l) => a + Number(l.valor), 0)
  const saldo = entradasPagas - saidasPagas
  const pendenteTotal = data
    .filter((l) => l.status !== "pago")
    .reduce((a, l) => a + Number(l.valor), 0)
  const atrasadoTotal = data
    .filter((l) => l.status === "atrasado")
    .reduce((a, l) => a + Number(l.valor), 0)

  // agrupar por data
  const grouped = useMemo(() => {
    const map = new Map<string, LancRow[]>()
    for (const l of filtered) {
      const arr = map.get(l.data_competencia) ?? []
      arr.push(l)
      map.set(l.data_competencia, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Financeiro · ${format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}`}
        title="Lançamentos"
        subtitle={`${data.length} lançamento${data.length === 1 ? "" : "s"} · ${filtered.length} visível${filtered.length === 1 ? "" : "is"} com os filtros`}
        actions={
          <>
            <Button variant="ghost" size="sm" disabled>
              <Download data-icon="inline-start" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Upload data-icon="inline-start" />
              Importar extrato
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus data-icon="inline-start" />
              Novo lançamento
            </Button>
          </>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          tone="success"
          label="Entradas (pagas)"
          value={formatBRL(entradasPagas)}
          sub={`${data.filter((l) => l.entrada_saida === "entrada" && l.status === "pago").length} recebimentos`}
          icon={<ArrowDown />}
        />
        <KpiCard
          tone="danger"
          label="Saídas (pagas)"
          value={formatBRL(saidasPagas)}
          sub={`${data.filter((l) => l.entrada_saida === "saida" && l.status === "pago").length} pagamentos`}
          icon={<ArrowUp />}
        />
        <KpiCard
          tone={saldo >= 0 ? "success" : "danger"}
          label="Saldo do período"
          value={formatBRL(saldo)}
          sub={saldo >= 0 ? "Positivo no consolidado" : "Negativo no consolidado"}
          icon={<Activity />}
        />
        <KpiCard
          tone={atrasadoTotal > 0 ? "warning" : "neutral"}
          label="A receber / pagar"
          value={formatBRL(pendenteTotal)}
          sub={
            <>
              {formatBRL(atrasadoTotal)}{" "}
              <span className="text-[var(--danger-ink)]">atrasados</span>
            </>
          }
          icon={<Clock />}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por descrição, fornecedor, ID…"
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
            <SegmentedControl
              value={filtroTipo}
              onValueChange={setFiltroTipo}
              options={TIPO_OPTIONS}
              ariaLabel="Tipo"
            />
            <SegmentedControl
              value={filtroStatus}
              onValueChange={setFiltroStatus}
              options={STATUS_OPTIONS}
              ariaLabel="Status"
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              Carregando lançamentos…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              {data.length === 0
                ? "Nenhum lançamento registrado ainda."
                : "Nenhum lançamento encontrado com esses filtros."}
            </div>
          ) : (
            grouped.map(([dataDay, lancs]) => (
              <div key={dataDay}>
                <div className="flex items-center justify-between bg-muted/40 px-5 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span className="font-semibold tabular-nums">
                    {format(parseISO(dataDay), "dd 'de' MMMM, EEEE", {
                      locale: ptBR,
                    })}
                  </span>
                  <span>
                    {lancs.length} lançamento{lancs.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div>
                  {lancs.map((l) => (
                    <LancamentoRow key={l.id_lancamento} l={l} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[12.5px] text-muted-foreground">
          <span>
            Mostrando {filtered.length} de {data.length} lançamento
            {data.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <LancamentoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </div>
  )
}

function LancamentoRow({ l }: { l: LancRow }) {
  const isEntrada = l.entrada_saida === "entrada"
  const valorClass = isEntrada
    ? "text-[var(--success-ink)]"
    : "text-[var(--danger-ink)]"

  const statusChip =
    l.status === "pago" ? (
      <CategoryChip tone="success">
        <span className="size-1.5 rounded-full bg-[var(--success)]" />
        Pago
      </CategoryChip>
    ) : l.status === "atrasado" ? (
      <CategoryChip tone="danger">
        <span className="size-1.5 rounded-full bg-destructive" />
        Atrasado
      </CategoryChip>
    ) : (
      <CategoryChip tone="warning">
        <span className="size-1.5 rounded-full bg-[var(--warning)]" />
        Pendente
      </CategoryChip>
    )

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-t border-border px-5 py-3 transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(220px,2fr)_minmax(140px,1fr)_minmax(180px,1.4fr)_minmax(120px,0.9fr)_minmax(120px,1fr)_minmax(110px,0.7fr)_40px]">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
            isEntrada
              ? "bg-[var(--success-soft)] text-[var(--success-ink)]"
              : "bg-[var(--danger-soft)] text-[var(--danger-ink)]"
          )}
        >
          {isEntrada ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-medium text-foreground">
            {l.historico ?? "(sem descrição)"}
          </div>
          <div className="mono text-[11.5px] text-muted-foreground tabular-nums">
            {lancCode(l.id_lancamento)}
          </div>
        </div>
      </div>

      <div>
        <CategoryChip tone={categoriaTone(l.centro_custo_nome)}>
          {l.centro_custo_nome || "Sem categoria"}
        </CategoryChip>
      </div>

      <div>
        <div className="truncate text-[13px] text-foreground">{l.obra_nome}</div>
        {l.fornecedor_nome ? (
          <div className="truncate text-[11.5px] text-muted-foreground">
            {l.fornecedor_nome}
          </div>
        ) : null}
      </div>

      <div>
        <div className="text-[13px] font-medium text-foreground">
          {l.forma_pagamento
            ? FORMA_LABEL[l.forma_pagamento] ?? l.forma_pagamento
            : "—"}
        </div>
        <div className="text-[11.5px] text-muted-foreground tabular-nums">
          venc. {format(parseISO(l.data_competencia), "dd/MM/yyyy")}
        </div>
      </div>

      <div className="text-right">
        <div className={cn("mono text-[14px] font-semibold tabular-nums", valorClass)}>
          {isEntrada ? "+ " : "− "}
          {formatBRL(Number(l.valor))}
        </div>
      </div>

      <div>{statusChip}</div>

      <div className="flex justify-end">
        <Button variant="ghost" size="icon-sm" aria-label="Mais ações">
          <MoreHorizontal />
        </Button>
      </div>
    </div>
  )
}
