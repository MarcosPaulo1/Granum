"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  AlertTriangle,
  Building,
  CheckCircle2,
  HardHat,
  TrendingUp,
} from "lucide-react"

import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { ProgressBar } from "@/components/shared/progress-bar"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { OBRA_STATUS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/utils/format"

interface ObraDashboard {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  data_inicio_prevista: string | null
  data_fim_prevista: string | null
  cliente: string
  responsavel: string | null
  total_planejado: number
  total_realizado: number
  tarefas_atrasadas: number
  pendencias_abertas: number
  trabalhadores_ativos: number
}

type Semaforo = "verde" | "amarelo" | "vermelho"

function calcularSemaforo(obra: ObraDashboard): Semaforo {
  const desvio =
    obra.total_planejado > 0
      ? ((obra.total_realizado - obra.total_planejado) /
          obra.total_planejado) *
        100
      : 0
  if (desvio > 20 || obra.tarefas_atrasadas >= 3) return "vermelho"
  if (desvio > 10 || obra.tarefas_atrasadas >= 1) return "amarelo"
  return "verde"
}

const SEMAFORO_META: Record<
  Semaforo,
  {
    label: string
    tone: "success" | "warning" | "danger"
    barClass: string
    Icon: React.ComponentType<{ className?: string }>
    iconClass: string
  }
> = {
  verde: {
    label: "Saudável",
    tone: "success",
    barClass: "before:bg-[var(--success)]",
    Icon: CheckCircle2,
    iconClass: "text-[var(--success)]",
  },
  amarelo: {
    label: "Atenção",
    tone: "warning",
    barClass: "before:bg-[var(--warning)]",
    Icon: AlertCircle,
    iconClass: "text-[var(--warning)]",
  },
  vermelho: {
    label: "Crítico",
    tone: "danger",
    barClass: "before:bg-destructive",
    Icon: AlertTriangle,
    iconClass: "text-destructive",
  },
}

export default function DashboardGeralPage() {
  const router = useRouter()
  const [obras, setObras] = useState<ObraDashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("vw_dashboard_obras")
      .select("*")

    if (error) {
      // Fallback se a view nao existir
      const { data: obrasRaw } = await supabase
        .from("obra")
        .select(
          "id_obra, nome, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista, id_cliente, id_responsavel"
        )
        .neq("status", "cancelada")

      if (obrasRaw) {
        const clienteIds = Array.from(
          new Set(obrasRaw.map((o) => o.id_cliente))
        )
        const respIds = Array.from(
          new Set(
            obrasRaw.filter((o) => o.id_responsavel).map((o) => o.id_responsavel!)
          )
        )

        const [{ data: clientes }, { data: resps }] = await Promise.all([
          clienteIds.length
            ? supabase
                .from("cliente")
                .select("id_cliente, nome")
                .in("id_cliente", clienteIds)
            : Promise.resolve({
                data: [] as { id_cliente: number; nome: string }[],
              }),
          respIds.length
            ? supabase
                .from("responsavel")
                .select("id_responsavel, nome")
                .in("id_responsavel", respIds)
            : Promise.resolve({
                data: [] as { id_responsavel: number; nome: string }[],
              }),
        ])

        const cliMap = new Map(
          (clientes ?? []).map((c) => [c.id_cliente, c.nome])
        )
        const respMap = new Map(
          (resps ?? []).map((r) => [r.id_responsavel, r.nome])
        )

        setObras(
          obrasRaw.map((o) => ({
            id_obra: o.id_obra,
            nome: o.nome,
            status: o.status ?? "planejamento",
            percentual_finalizada: o.percentual_finalizada ?? 0,
            data_inicio_prevista: o.data_inicio_prevista,
            data_fim_prevista: o.data_fim_prevista,
            cliente: cliMap.get(o.id_cliente) ?? "",
            responsavel: o.id_responsavel
              ? respMap.get(o.id_responsavel) ?? null
              : null,
            total_planejado: 0,
            total_realizado: 0,
            tarefas_atrasadas: 0,
            pendencias_abertas: 0,
            trabalhadores_ativos: 0,
          }))
        )
      }
    } else {
      setObras((data ?? []) as ObraDashboard[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const totalPlanejado = obras.reduce((s, o) => s + o.total_planejado, 0)
  const totalRealizado = obras.reduce((s, o) => s + o.total_realizado, 0)
  const totalTrabalhadores = obras.reduce(
    (s, o) => s + o.trabalhadores_ativos,
    0
  )
  const obrasAtivas = obras.filter((o) => o.status === "em_andamento").length

  const semaforos = obras.map((o) => ({ ...o, semaforo: calcularSemaforo(o) }))
  const countVerde = semaforos.filter((o) => o.semaforo === "verde").length
  const countAmarelo = semaforos.filter((o) => o.semaforo === "amarelo").length
  const countVermelho = semaforos.filter((o) => o.semaforo === "vermelho").length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Visão geral · Operação"
        title="Dashboard"
        subtitle={`${obras.length} obra${obras.length === 1 ? "" : "s"} sob acompanhamento · ${obrasAtivas} ativas`}
      />

      <KpiGrid cols={4}>
        <KpiCard
          tone="info"
          label="Obras ativas"
          value={obrasAtivas}
          sub={`${obras.length} no total`}
          icon={<Building />}
        />
        <KpiCard
          label="Total planejado"
          value={formatBRL(totalPlanejado)}
          sub="Custo previsto consolidado"
        />
        <KpiCard
          tone={
            totalRealizado > totalPlanejado * 1.1
              ? "warning"
              : "success"
          }
          label="Total realizado"
          value={formatBRL(totalRealizado)}
          sub={
            totalPlanejado > 0
              ? `${Math.round((totalRealizado * 100) / totalPlanejado)}% do orçado`
              : "—"
          }
          icon={<TrendingUp />}
        />
        <KpiCard
          tone="primary"
          label="Trabalhadores"
          value={totalTrabalhadores}
          sub="Em obras ativas"
          icon={<HardHat />}
        />
      </KpiGrid>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-4 text-[13px]">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Semáforo das obras
          </span>
          <CategoryChip tone="success">
            <CheckCircle2 className="size-3" />
            {countVerde} saudáve{countVerde === 1 ? "l" : "is"}
          </CategoryChip>
          <CategoryChip tone="warning">
            <AlertCircle className="size-3" />
            {countAmarelo} atenção
          </CategoryChip>
          <CategoryChip tone="danger">
            <AlertTriangle className="size-3" />
            {countVermelho} crítica{countVermelho === 1 ? "" : "s"}
          </CategoryChip>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Carregando obras…
          </CardContent>
        </Card>
      ) : obras.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma obra cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {semaforos.map((obra) => {
            const meta = SEMAFORO_META[obra.semaforo]
            const desvio =
              obra.total_planejado > 0
                ? ((obra.total_realizado - obra.total_planejado) /
                    obra.total_planejado) *
                  100
                : 0
            return (
              <button
                key={obra.id_obra}
                onClick={() => router.push(`/obras/${obra.id_obra}`)}
                className={cn(
                  "group relative overflow-hidden rounded-md border border-border bg-card text-left transition-all hover:border-primary/40 hover:shadow-md",
                  "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-transparent",
                  meta.barClass
                )}
              >
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14.5px] font-semibold text-foreground">
                        {obra.nome}
                      </h3>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        {obra.cliente || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <meta.Icon className={cn("size-4", meta.iconClass)} />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Progresso
                      </span>
                      <span className="mono text-[12px] font-medium tabular-nums text-foreground">
                        {Math.round(obra.percentual_finalizada ?? 0)}%
                      </span>
                    </div>
                    <ProgressBar value={obra.percentual_finalizada ?? 0} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11.5px]">
                    <div>
                      <div className="text-muted-foreground">Planejado</div>
                      <div className="mono font-medium tabular-nums text-foreground">
                        {formatBRL(obra.total_planejado)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Realizado</div>
                      <div className="mono font-medium tabular-nums text-foreground">
                        {formatBRL(obra.total_realizado)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Desvio</div>
                      <div
                        className={cn(
                          "mono font-medium tabular-nums",
                          desvio > 10
                            ? "text-[var(--danger-ink)]"
                            : desvio < -10
                              ? "text-[var(--success-ink)]"
                              : "text-muted-foreground"
                        )}
                      >
                        {desvio >= 0 ? "+" : ""}
                        {desvio.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Responsável</div>
                      <div className="truncate font-medium text-foreground">
                        {obra.responsavel ?? "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                    <StatusBadge
                      status={obra.status}
                      statusMap={OBRA_STATUS}
                    />
                    {obra.tarefas_atrasadas > 0 ? (
                      <CategoryChip tone="danger">
                        {obra.tarefas_atrasadas} atrasada
                        {obra.tarefas_atrasadas > 1 ? "s" : ""}
                      </CategoryChip>
                    ) : null}
                    {obra.pendencias_abertas > 0 ? (
                      <CategoryChip tone="warning">
                        {obra.pendencias_abertas} pendência
                        {obra.pendencias_abertas > 1 ? "s" : ""}
                      </CategoryChip>
                    ) : null}
                    {obra.tarefas_atrasadas === 0 &&
                    obra.pendencias_abertas === 0 ? (
                      <CategoryChip tone="success">Sem alertas</CategoryChip>
                    ) : null}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
