"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { differenceInCalendarDays, parseISO } from "date-fns"
import {
  Activity,
  ArrowLeft,
  Calendar,
  HardHat,
  ListChecks,
  MapPin,
  Pencil,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react"

import { ObraForm } from "@/components/forms/obra-form"
import { DiariosTab } from "@/components/obra-tabs/diarios-tab"
import { DocumentosTab } from "@/components/obra-tabs/documentos-tab"
import { EquipeTab } from "@/components/obra-tabs/equipe-tab"
import { FinanceiroTab } from "@/components/obra-tabs/financeiro-tab"
import { TarefasTab } from "@/components/obra-tabs/tarefas-tab"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { ProgressBar } from "@/components/shared/progress-bar"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/lib/hooks/use-user"
import { OBRA_STATUS, TAREFA_STATUS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL, formatDate } from "@/lib/utils/format"

interface Obra {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  descricao: string | null
  endereco: string | null
  data_inicio_prevista: string | null
  data_fim_prevista: string | null
  data_inicio_real: string | null
  data_fim_real: string | null
  id_cliente: number
  id_centro_custo: number | null
  id_responsavel: number | null
}

interface Tarefa {
  id_tarefa: number
  nome: string
  status: string
  percentual_concluido: number
}

export default function ObraPainelPage() {
  const params = useParams()
  const { role } = useUser()
  const [obra, setObra] = useState<Obra | null>(null)
  const [clienteNome, setClienteNome] = useState("")
  const [responsavelNome, setResponsavelNome] = useState("")
  const [centroCustoNome, setCentroCustoNome] = useState("")
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [kpis, setKpis] = useState({
    planejado: 0,
    realizado: 0,
    nTarefas: 0,
    nTrabalhadores: 0,
  })
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: o } = await supabase
      .from("obra")
      .select("*")
      .eq("id_obra", id)
      .single()
    if (!o) return
    setObra(o as Obra)

    const { data: cli } = await supabase
      .from("cliente")
      .select("nome")
      .eq("id_cliente", o.id_cliente)
      .single()
    setClienteNome((cli as { nome: string } | null)?.nome ?? "")

    if (o.id_responsavel) {
      const { data: resp } = await supabase
        .from("responsavel")
        .select("nome")
        .eq("id_responsavel", o.id_responsavel)
        .single()
      setResponsavelNome((resp as { nome: string } | null)?.nome ?? "")
    }

    if (o.id_centro_custo) {
      const { data: cc } = await supabase
        .from("centro_custo")
        .select("codigo, nome")
        .eq("id_centro_custo", o.id_centro_custo)
        .single()
      setCentroCustoNome(
        cc
          ? `${(cc as { codigo: string; nome: string }).codigo} · ${(cc as { codigo: string; nome: string }).nome}`
          : ""
      )
    }

    const { data: tarefasData } = await supabase
      .from("tarefa")
      .select("id_tarefa, nome, status, percentual_concluido")
      .eq("id_obra", id)
      .order("ordem")
    setTarefas((tarefasData ?? []) as Tarefa[])

    const { data: lancs } = await supabase
      .from("lancamento")
      .select("valor, tipo")
      .eq("id_obra", id)
    const lancsList = (lancs ?? []) as { valor: number; tipo: string }[]
    const planejado = lancsList
      .filter((l) => l.tipo === "planejado")
      .reduce((s, l) => s + Number(l.valor), 0)
    const realizado = lancsList
      .filter((l) => l.tipo === "realizado")
      .reduce((s, l) => s + Number(l.valor), 0)

    const { data: contratos } = await supabase
      .from("contrato_trabalho")
      .select("id_trabalhador")
      .eq("id_obra", id)
      .eq("status", "ativo")
    const uniqueWorkers = new Set(
      (contratos ?? []).map(
        (c: { id_trabalhador: number }) => c.id_trabalhador
      )
    )

    setKpis({
      planejado,
      realizado,
      nTarefas: (tarefasData ?? []).length,
      nTrabalhadores: uniqueWorkers.size,
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!obra) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Carregando obra…
      </div>
    )
  }

  const canEdit = role === "diretor" || role === "engenheiro"
  const variacao =
    kpis.planejado > 0
      ? ((kpis.realizado - kpis.planejado) / kpis.planejado) * 100
      : 0
  const variacaoTone =
    Math.abs(variacao) < 5
      ? "neutral"
      : variacao > 15
        ? "danger"
        : variacao > 0
          ? "warning"
          : "success"

  const tarefasConcluidas = tarefas.filter((t) => t.status === "concluida").length
  const tarefasAtivas = tarefas.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelada"
  ).length

  const diasParaFim = obra.data_fim_prevista
    ? differenceInCalendarDays(parseISO(obra.data_fim_prevista), new Date())
    : null

  const obraCode = `OBR-${String(obra.id_obra).padStart(4, "0")}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link
          href="/obras"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Obras
        </Link>
        <span>·</span>
        <span className="mono tabular-nums">{obraCode}</span>
      </div>

      <PageHeader
        eyebrow={`Obras · ${clienteNome || "—"}`}
        title={obra.nome}
        badge={<StatusBadge status={obra.status} statusMap={OBRA_STATUS} />}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {responsavelNome ? (
              <span className="inline-flex items-center gap-1">
                <User className="size-3.5" />
                {responsavelNome}
              </span>
            ) : null}
            {centroCustoNome ? (
              <span className="inline-flex items-center gap-1 mono tabular-nums">
                <Activity className="size-3.5" />
                {centroCustoNome}
              </span>
            ) : null}
            {obra.endereco ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {obra.endereco}
              </span>
            ) : null}
          </span>
        }
        actions={
          canEdit ? (
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-baseline justify-between">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              Progresso físico
            </div>
            <div className="mono text-2xl font-semibold tabular-nums text-foreground">
              {Math.round(obra.percentual_finalizada ?? 0)}
              <span className="text-base text-muted-foreground">%</span>
            </div>
          </div>
          <ProgressBar value={obra.percentual_finalizada ?? 0} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            {obra.data_inicio_prevista ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                Início: {formatDate(obra.data_inicio_prevista)}
              </span>
            ) : null}
            {obra.data_fim_prevista ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" />
                Fim: {formatDate(obra.data_fim_prevista)}
                {diasParaFim !== null ? (
                  <CategoryChip
                    tone={
                      diasParaFim < 0
                        ? "danger"
                        : diasParaFim < 30
                          ? "warning"
                          : "info"
                    }
                    className="ml-1"
                  >
                    {diasParaFim < 0
                      ? `${Math.abs(diasParaFim)}d em atraso`
                      : `${diasParaFim}d restantes`}
                  </CategoryChip>
                ) : null}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <KpiGrid cols={4}>
        <KpiCard
          label="Custo planejado"
          value={formatBRL(kpis.planejado)}
          sub="Total previsto"
          icon={<Activity />}
        />
        <KpiCard
          tone="info"
          label="Custo realizado"
          value={formatBRL(kpis.realizado)}
          sub={
            kpis.planejado > 0
              ? `${Math.round((kpis.realizado * 100) / kpis.planejado)}% do planejado`
              : "Sem planejamento"
          }
          icon={<TrendingUp />}
        />
        <KpiCard
          tone={variacaoTone}
          label="Variação"
          value={`${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}%`}
          sub={
            Math.abs(variacao) < 5
              ? "Dentro do previsto"
              : variacao > 0
                ? "Acima do orçado"
                : "Abaixo do orçado"
          }
          trend={variacao > 0 ? "down" : "up"}
          icon={variacao > 0 ? <TrendingUp /> : <TrendingDown />}
        />
        <KpiCard
          tone="primary"
          label="Equipe"
          value={kpis.nTrabalhadores}
          sub={`${kpis.nTarefas} tarefa${kpis.nTarefas === 1 ? "" : "s"} · ${tarefasAtivas} em aberto`}
          icon={<HardHat />}
        />
      </KpiGrid>

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto rounded-md border border-border bg-card p-1">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="diarios">Diários</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="space-y-4 py-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-foreground">
                    Próximas tarefas
                  </h3>
                  <span className="text-[12px] text-muted-foreground">
                    {tarefasConcluidas}/{kpis.nTarefas} concluídas
                  </span>
                </div>
                {tarefasAtivas === 0 ? (
                  <p className="py-6 text-center text-[13px] text-muted-foreground">
                    {kpis.nTarefas === 0
                      ? "Nenhuma tarefa cadastrada ainda."
                      : "Todas as tarefas foram concluídas. 🎉"}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {tarefas
                      .filter(
                        (t) =>
                          t.status !== "concluida" && t.status !== "cancelada"
                      )
                      .slice(0, 6)
                      .map((t) => (
                        <div
                          key={t.id_tarefa}
                          className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/30"
                        >
                          <span className="min-w-0 truncate text-[13px] text-foreground">
                            {t.nome}
                          </span>
                          <div className="flex shrink-0 items-center gap-3">
                            <ProgressBar
                              value={t.percentual_concluido ?? 0}
                              className="w-24"
                            />
                            <span className="mono w-8 text-right text-[11.5px] font-medium tabular-nums text-muted-foreground">
                              {Math.round(t.percentual_concluido ?? 0)}%
                            </span>
                            <StatusBadge
                              status={t.status}
                              statusMap={TAREFA_STATUS}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 py-5">
                <h3 className="text-[15px] font-semibold text-foreground">
                  Detalhes
                </h3>
                <dl className="space-y-2.5 text-[13px]">
                  <Detail label="Cliente" value={clienteNome || "—"} />
                  <Detail label="Responsável" value={responsavelNome || "—"} />
                  {centroCustoNome ? (
                    <Detail label="Centro de custo" value={centroCustoNome} mono />
                  ) : null}
                  {obra.endereco ? (
                    <Detail label="Endereço" value={obra.endereco} />
                  ) : null}
                  {obra.data_inicio_prevista ? (
                    <Detail
                      label="Início previsto"
                      value={formatDate(obra.data_inicio_prevista)}
                      mono
                    />
                  ) : null}
                  {obra.data_fim_prevista ? (
                    <Detail
                      label="Fim previsto"
                      value={formatDate(obra.data_fim_prevista)}
                      mono
                    />
                  ) : null}
                  {obra.data_inicio_real ? (
                    <Detail
                      label="Início real"
                      value={formatDate(obra.data_inicio_real)}
                      mono
                    />
                  ) : null}
                  {obra.descricao ? (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Descrição
                      </dt>
                      <dd className="mt-1 text-foreground">{obra.descricao}</dd>
                    </div>
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-2 py-5">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <ListChecks className="size-4" />
                Resumo de tarefas por status
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(
                  Object.entries(TAREFA_STATUS) as [
                    keyof typeof TAREFA_STATUS,
                    { label: string },
                  ][]
                ).map(([status, meta]) => {
                  const count = tarefas.filter((t) => t.status === status).length
                  return (
                    <div
                      key={status}
                      className={cn(
                        "rounded-md border border-border px-3 py-2.5"
                      )}
                    >
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {meta.label}
                      </div>
                      <div className="mono text-xl font-semibold tabular-nums text-foreground">
                        {count}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tarefas">
          <TarefasTab obraId={obra.id_obra} role={role} />
        </TabsContent>
        <TabsContent value="equipe">
          <EquipeTab obraId={obra.id_obra} />
        </TabsContent>
        <TabsContent value="financeiro">
          <FinanceiroTab obraId={obra.id_obra} />
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentosTab obraId={obra.id_obra} />
        </TabsContent>
        <TabsContent value="diarios">
          <DiariosTab obraId={obra.id_obra} role={role} />
        </TabsContent>
      </Tabs>

      <ObraForm
        open={formOpen}
        onOpenChange={setFormOpen}
        obra={obra as unknown as Record<string, unknown>}
        onSuccess={load}
      />
    </div>
  )
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right text-foreground",
          mono && "mono tabular-nums"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
