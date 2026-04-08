"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  id_etapa: z.number().optional(),
  id_responsavel: z.number().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  descricao: z.string().optional(),
  orcamento_previsto: z.number().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  obraId: number
  tarefa?: Record<string, unknown> | null
  onSuccess: () => void
}

export function TarefaForm({ open, onOpenChange, obraId, tarefa, onSuccess }: Props) {
  const [etapas, setEtapas] = useState<{ id_etapa: number; nome: string }[]>([])
  const [responsaveis, setResponsaveis] = useState<{ id_responsavel: number; nome: string }[]>([])
  const [optionsLoaded, setOptionsLoaded] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: tarefa ? {
      nome: tarefa.nome as string,
      id_etapa: tarefa.id_etapa as number | undefined,
      id_responsavel: tarefa.id_responsavel as number | undefined,
      data_inicio: (tarefa.data_inicio as string) ?? "",
      data_fim: (tarefa.data_fim as string) ?? "",
      descricao: (tarefa.descricao as string) ?? "",
      orcamento_previsto: tarefa.orcamento_previsto as number | undefined,
    } : {},
  })

  useEffect(() => {
    if (!open) { setOptionsLoaded(false); return }
    const supabase = createClient()
    Promise.all([
      supabase.from("etapa").select("id_etapa, nome").order("ordem"),
      supabase.from("responsavel").select("id_responsavel, nome").eq("ativo", true).order("nome"),
    ]).then(([e, r]) => {
      setEtapas((e.data ?? []) as { id_etapa: number; nome: string }[])
      setResponsaveis((r.data ?? []) as { id_responsavel: number; nome: string }[])
      setOptionsLoaded(true)
    })
  }, [open])

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const payload = { ...data, id_obra: obraId }

    if (tarefa) {
      const { error } = await supabase.from("tarefa").update(payload).eq("id_tarefa", tarefa.id_tarefa as number)
      if (error) { toast.error("Erro ao atualizar tarefa"); return }
      toast.success("Tarefa atualizada")
    } else {
      const { error } = await supabase.from("tarefa").insert(payload)
      if (error) { toast.error("Erro ao criar tarefa: " + error.message); return }
      toast.success("Tarefa criada")
    }

    reset()
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tarefa ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input {...register("nome")} />
            {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label>Etapa</Label>
            <Select value={optionsLoaded ? (watch("id_etapa")?.toString() || "") : ""} onValueChange={(v) => v && setValue("id_etapa", Number(v))}>
              <SelectTrigger><SelectValue placeholder={optionsLoaded ? "Selecione" : "Carregando..."} /></SelectTrigger>
              <SelectContent>
                {etapas.map((e) => <SelectItem key={e.id_etapa} value={e.id_etapa.toString()}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Responsável</Label>
            <Select value={optionsLoaded ? (watch("id_responsavel")?.toString() || "") : ""} onValueChange={(v) => v && setValue("id_responsavel", Number(v))}>
              <SelectTrigger><SelectValue placeholder={optionsLoaded ? "Selecione" : "Carregando..."} /></SelectTrigger>
              <SelectContent>
                {responsaveis.map((r) => <SelectItem key={r.id_responsavel} value={r.id_responsavel.toString()}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Data início</Label><Input {...register("data_inicio")} type="date" /></div>
            <div><Label>Data fim</Label><Input {...register("data_fim")} type="date" /></div>
          </div>
          <div>
            <Label>Orçamento previsto (R$)</Label>
            <Input {...register("orcamento_previsto", { valueAsNumber: true })} type="number" step="0.01" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea {...register("descricao")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
