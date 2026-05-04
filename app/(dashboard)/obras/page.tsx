"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Building,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { ObraForm } from "@/components/forms/obra-form"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { ProgressBar } from "@/components/shared/progress-bar"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/shared/segmented-control"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OBRA_STATUS } from "@/lib/constants"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"

interface ObraRow {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  data_inicio_prevista: string | null
  data_fim_prevista: string | null
  cliente_nome: string
  responsavel_nome: string
}

const STATUS_OPTIONS: SegmentedOption<"todos" | string>[] = [
  { value: "todos", label: "Todos" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "planejamento", label: "Planejamento" },
  { value: "pausada", label: "Pausadas" },
  { value: "concluida", label: "Concluídas" },
]

function obraCode(id: number) {
  return `OBR-${String(id).padStart(4, "0")}`
}

export default function ObrasPage() {
  const router = useRouter()
  const { role } = useUser()
  const [rows, setRows] = useState<ObraRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<"todos" | string>("todos")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: obraList, error } = await supabase
      .from("obra")
      .select(
        "id_obra, id_cliente, id_responsavel, nome, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista"
      )
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar obras: " + error.message)
      setIsLoading(false)
      return
    }

    const list = obraList ?? []
    const clienteIds = Array.from(new Set(list.map((o) => o.id_cliente)))
    const respIds = Array.from(
      new Set(list.filter((o) => o.id_responsavel).map((o) => o.id_responsavel!))
    )

    const [{ data: clientes }, { data: resps }] = await Promise.all([
      clienteIds.length
        ? supabase
            .from("cliente")
            .select("id_cliente, nome")
            .in("id_cliente", clienteIds)
        : Promise.resolve({ data: [] as { id_cliente: number; nome: string }[] }),
      respIds.length
        ? supabase
            .from("responsavel")
            .select("id_responsavel, nome")
            .in("id_responsavel", respIds)
        : Promise.resolve({
            data: [] as { id_responsavel: number; nome: string }[],
          }),
    ])

    const clienteMap = new Map(
      (clientes ?? []).map((c) => [c.id_cliente, c.nome])
    )
    const respMap = new Map(
      (resps ?? []).map((r) => [r.id_responsavel, r.nome])
    )

    setRows(
      list.map((o) => ({
        id_obra: o.id_obra,
        nome: o.nome,
        status: o.status ?? "planejamento",
        percentual_finalizada: o.percentual_finalizada ?? 0,
        data_inicio_prevista: o.data_inicio_prevista,
        data_fim_prevista: o.data_fim_prevista,
        cliente_nome: clienteMap.get(o.id_cliente) ?? "",
        responsavel_nome: o.id_responsavel
          ? respMap.get(o.id_responsavel) ?? ""
          : "",
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      rows.filter((o) => {
        if (filtroStatus !== "todos" && o.status !== filtroStatus) return false
        if (busca) {
          const q = busca.toLowerCase()
          const haystack = [o.nome, o.cliente_nome, o.responsavel_nome]
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [rows, filtroStatus, busca]
  )

  const total = rows.length
  const emAndamento = rows.filter((o) => o.status === "em_andamento").length
  const planejamento = rows.filter((o) => o.status === "planejamento").length
  const concluidas = rows.filter((o) => o.status === "concluida").length
  const progressoMedio =
    rows.length === 0
      ? 0
      : Math.round(
          rows
            .filter((r) => r.status !== "cancelada")
            .reduce((a, r) => a + (r.percentual_finalizada ?? 0), 0) /
            Math.max(rows.filter((r) => r.status !== "cancelada").length, 1)
        )

  const canCreate = role === "diretor" || role === "arquiteta"

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operação"
        title="Obras"
        subtitle={`${total} obra${total === 1 ? "" : "s"} cadastrada${total === 1 ? "" : "s"} · ${emAndamento} em andamento`}
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
            {canCreate ? (
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus data-icon="inline-start" />
                Nova obra
              </Button>
            ) : null}
          </>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          label="Total de obras"
          value={total}
          sub={`${concluidas} concluída${concluidas === 1 ? "" : "s"}`}
          icon={<Building />}
        />
        <KpiCard
          tone="info"
          label="Em andamento"
          value={emAndamento}
          sub={`${total ? Math.round((emAndamento * 100) / total) : 0}% do total`}
          icon={<Activity />}
        />
        <KpiCard
          tone="primary"
          label="Em planejamento"
          value={planejamento}
          sub="Aguardando início"
          icon={<ClipboardList />}
        />
        <KpiCard
          tone={
            progressoMedio >= 80
              ? "success"
              : progressoMedio >= 50
                ? "info"
                : "warning"
          }
          label="Progresso médio"
          value={`${progressoMedio}%`}
          sub="Obras ativas"
          icon={<CheckCircle2 />}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, cliente, responsável…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <SegmentedControl
            value={filtroStatus}
            onValueChange={setFiltroStatus}
            options={STATUS_OPTIONS}
            ariaLabel="Status"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-semibold">Obra</th>
                <th className="px-5 py-2.5 text-left font-semibold">Cliente</th>
                <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                <th className="min-w-[200px] px-5 py-2.5 text-left font-semibold">
                  Progresso
                </th>
                <th className="px-5 py-2.5 text-left font-semibold">
                  Responsável
                </th>
                <th className="px-5 py-2.5 text-left font-semibold">Prazo</th>
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
                    Carregando obras…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    {rows.length === 0
                      ? "Nenhuma obra cadastrada. Crie a primeira."
                      : "Nenhuma obra encontrada com esses filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id_obra}
                    className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
                    onClick={() => router.push(`/obras/${o.id_obra}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="text-[13.5px] font-medium text-foreground">
                        {o.nome}
                      </div>
                      <div className="mono mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
                        {obraCode(o.id_obra)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-foreground">
                      {o.cliente_nome || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge
                        status={o.status}
                        statusMap={OBRA_STATUS}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProgressBar
                          value={o.percentual_finalizada ?? 0}
                          className="w-32"
                        />
                        <span
                          className={cn(
                            "mono w-10 text-right text-[12px] font-medium tabular-nums",
                            o.percentual_finalizada >= 80
                              ? "text-[var(--success-ink)]"
                              : "text-muted-foreground"
                          )}
                        >
                          {Math.round(o.percentual_finalizada ?? 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-foreground">
                      {o.responsavel_nome || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-[12.5px] text-foreground">
                        <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
                        <div className="tabular-nums">
                          {o.data_inicio_prevista
                            ? formatDate(o.data_inicio_prevista)
                            : "—"}
                          {o.data_fim_prevista ? (
                            <>
                              {" "}
                              <span className="text-muted-foreground">→</span>{" "}
                              {formatDate(o.data_fim_prevista)}
                            </>
                          ) : null}
                        </div>
                      </div>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[12.5px] text-muted-foreground">
          <span>
            Mostrando {filtered.length} de {total} obra{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <ObraForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </div>
  )
}
