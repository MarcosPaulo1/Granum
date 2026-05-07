"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarDays, DollarSign, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { TarefaForm } from "@/components/forms/tarefa-form"
import { ProgressBar } from "@/components/shared/progress-bar"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TAREFA_STATUS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL, formatDate } from "@/lib/utils/format"

interface Tarefa {
  id_tarefa: number
  nome: string
  status: string
  percentual_concluido: number
  data_inicio: string | null
  data_fim: string | null
  orcamento_previsto: number
  id_etapa: number | null
  id_responsavel: number | null
  descricao: string | null
  ordem: number
}

interface TarefasTabProps {
  obraId: number
  role: string | null
}

export function TarefasTab({ obraId, role }: TarefasTabProps) {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editTarefa, setEditTarefa] = useState<Tarefa | null>(null)
  const [etapasMap, setEtapasMap] = useState<Map<number, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("tarefa")
      .select("*")
      .eq("id_obra", obraId)
      .order("ordem")
    setTarefas((data ?? []) as Tarefa[])

    const { data: etapas } = await supabase
      .from("etapa")
      .select("id_etapa, nome")
    setEtapasMap(
      new Map(
        (etapas ?? []).map(
          (e: { id_etapa: number; nome: string }) => [e.id_etapa, e.nome]
        )
      )
    )
    setIsLoading(false)
  }, [obraId])

  useEffect(() => {
    load()
  }, [load])

  async function recalcObraPercentual() {
    const supabase = createClient()
    const { data: allTarefas } = await supabase
      .from("tarefa")
      .select("percentual_concluido")
      .eq("id_obra", obraId)

    if (allTarefas && allTarefas.length > 0) {
      const avg =
        (allTarefas as { percentual_concluido: number }[]).reduce(
          (s, t) => s + t.percentual_concluido,
          0
        ) / allTarefas.length
      await supabase
        .from("obra")
        .update({ percentual_finalizada: Math.round(avg * 100) / 100 })
        .eq("id_obra", obraId)
    }
  }

  async function updateStatus(tarefa: Tarefa, newStatus: string) {
    const supabase = createClient()
    const update: Record<string, unknown> = { status: newStatus }
    if (newStatus === "concluida") update.percentual_concluido = 100
    const { error } = await supabase
      .from("tarefa")
      .update(update)
      .eq("id_tarefa", tarefa.id_tarefa)
    if (error) {
      toast.error("Erro: " + error.message)
      return
    }
    toast.success("Status atualizado")
    await recalcObraPercentual()
    load()
  }

  async function updatePercent(tarefa: Tarefa, percent: number) {
    const supabase = createClient()
    await supabase
      .from("tarefa")
      .update({ percentual_concluido: percent })
      .eq("id_tarefa", tarefa.id_tarefa)
    await recalcObraPercentual()
    load()
  }

  const canEdit = role === "diretor" || role === "engenheiro"

  // Agrupar por etapa
  const grouped = tarefas.reduce((acc, t) => {
    const key = t.id_etapa ?? -1
    if (!acc.has(key)) acc.set(key, [])
    acc.get(key)!.push(t)
    return acc
  }, new Map<number, Tarefa[]>())

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">
              Tarefas da obra
            </h3>
            <p className="text-[12px] text-muted-foreground">
              {tarefas.length} tarefa{tarefas.length === 1 ? "" : "s"} ·{" "}
              {tarefas.filter((t) => t.status === "concluida").length} concluída
              {tarefas.filter((t) => t.status === "concluida").length === 1
                ? ""
                : "s"}
            </p>
          </div>
          {canEdit ? (
            <Button
              size="sm"
              onClick={() => {
                setEditTarefa(null)
                setFormOpen(true)
              }}
            >
              <Plus data-icon="inline-start" />
              Nova tarefa
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Carregando tarefas…
          </CardContent>
        </Card>
      ) : tarefas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma tarefa cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([etapaId, group]) => (
            <Card key={etapaId}>
              <CardContent className="space-y-2 py-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {etapaId === -1
                      ? "Sem etapa"
                      : etapasMap.get(etapaId) ?? `Etapa ${etapaId}`}
                  </h4>
                  <span className="text-[11.5px] text-muted-foreground">
                    {group.length} tarefa{group.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.map((t) => (
                    <div
                      key={t.id_tarefa}
                      className={cn(
                        "rounded-md border border-border p-3",
                        t.status === "concluida" && "bg-[var(--success-soft)]/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-medium text-foreground">
                              {t.nome}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
                            {t.data_inicio ? (
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <CalendarDays className="size-3" />
                                {formatDate(t.data_inicio)}
                                {t.data_fim ? ` → ${formatDate(t.data_fim)}` : ""}
                              </span>
                            ) : null}
                            {t.orcamento_previsto > 0 ? (
                              <span className="mono inline-flex items-center gap-1 tabular-nums">
                                <DollarSign className="size-3" />
                                {formatBRL(t.orcamento_previsto)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {canEdit ? (
                            <>
                              <Select
                                value={t.status}
                                onValueChange={(v) => v && updateStatus(t, v)}
                              >
                                <SelectTrigger className="h-7 w-36 text-[12px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(TAREFA_STATUS).map(
                                    ([k, v]) => (
                                      <SelectItem key={k} value={k}>
                                        {v.label}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setEditTarefa(t)
                                  setFormOpen(true)
                                }}
                                aria-label="Editar"
                              >
                                <Pencil />
                              </Button>
                            </>
                          ) : (
                            <StatusBadge
                              status={t.status}
                              statusMap={TAREFA_STATUS}
                            />
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <ProgressBar
                          value={t.percentual_concluido}
                          className="flex-1"
                        />
                        <span className="mono w-10 text-right text-[12px] font-medium tabular-nums text-muted-foreground">
                          {Math.round(t.percentual_concluido)}%
                        </span>
                        {canEdit ? (
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={t.percentual_concluido}
                            onChange={(e) =>
                              updatePercent(t, Number(e.target.value))
                            }
                            className="w-20 accent-[var(--primary)]"
                            aria-label={`Progresso de ${t.nome}`}
                          />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TarefaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        obraId={obraId}
        tarefa={editTarefa as unknown as Record<string, unknown> | null}
        onSuccess={async () => {
          await recalcObraPercentual()
          load()
        }}
      />
    </div>
  )
}

