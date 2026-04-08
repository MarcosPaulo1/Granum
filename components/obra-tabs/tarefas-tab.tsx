"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { ProgressBar } from "@/components/shared/progress-bar"
import { TarefaForm } from "@/components/forms/tarefa-form"
import { TAREFA_STATUS } from "@/lib/constants"
import { formatBRL, formatDate } from "@/lib/utils/format"
import { Plus, Pencil } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

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

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("tarefa").select("*").eq("id_obra", obraId).order("ordem")
    setTarefas((data ?? []) as Tarefa[])

    const { data: etapas } = await supabase.from("etapa").select("id_etapa, nome")
    setEtapasMap(new Map((etapas ?? []).map((e: { id_etapa: number; nome: string }) => [e.id_etapa, e.nome])))
  }, [obraId])

  useEffect(() => { load() }, [load])

  async function updateStatus(tarefa: Tarefa, newStatus: string) {
    const supabase = createClient()
    const update: Record<string, unknown> = { status: newStatus }
    if (newStatus === "concluida") update.percentual_concluido = 100
    await supabase.from("tarefa").update(update).eq("id_tarefa", tarefa.id_tarefa)
    toast.success("Status atualizado")
    load()
  }

  async function updatePercent(tarefa: Tarefa, percent: number) {
    const supabase = createClient()
    await supabase.from("tarefa").update({ percentual_concluido: percent }).eq("id_tarefa", tarefa.id_tarefa)
    load()
  }

  const canEdit = role === "diretor" || role === "engenheiro"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tarefas da obra</h3>
        {canEdit && (
          <Button size="sm" onClick={() => { setEditTarefa(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Nova tarefa
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {tarefas.map((t) => (
          <div key={t.id_tarefa} className="border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t.nome}</span>
                {t.id_etapa && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{etapasMap.get(t.id_etapa)}</span>}
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <>
                    <Select value={t.status} onValueChange={(v) => v && updateStatus(t, v)}>
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TAREFA_STATUS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => { setEditTarefa(t); setFormOpen(true) }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {!canEdit && <StatusBadge status={t.status} statusMap={TAREFA_STATUS} />}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {t.data_inicio && <span>Início: {formatDate(t.data_inicio)}</span>}
              {t.data_fim && <span>Fim: {formatDate(t.data_fim)}</span>}
              {t.orcamento_previsto > 0 && <span>Orçamento: {formatBRL(t.orcamento_previsto)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <ProgressBar value={t.percentual_concluido} className="flex-1" />
              {canEdit && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={t.percentual_concluido}
                  onChange={(e) => updatePercent(t, Number(e.target.value))}
                  className="w-24"
                />
              )}
            </div>
          </div>
        ))}
        {tarefas.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma tarefa cadastrada.</p>}
      </div>

      <TarefaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        obraId={obraId}
        tarefa={editTarefa as unknown as Record<string, unknown> | null}
        onSuccess={load}
      />
    </div>
  )
}
