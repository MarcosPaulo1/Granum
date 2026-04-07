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
import { TIPO_PAGAMENTO } from "@/lib/constants"

const schema = z.object({
  id_trabalhador: z.number().min(1, "Selecione um trabalhador"),
  id_obra: z.number().min(1, "Selecione uma obra"),
  tipo_pagamento: z.string().min(1, "Selecione o tipo"),
  valor_acordado: z.number().positive("Valor deve ser positivo"),
  data_inicio: z.string().min(1, "Data obrigatória"),
  data_fim: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contrato?: Record<string, unknown> | null
  onSuccess: () => void
}

export function ContratoForm({ open, onOpenChange, contrato, onSuccess }: Props) {
  const [trabalhadores, setTrabalhadores] = useState<{ id_trabalhador: number; nome: string }[]>([])
  const [obras, setObras] = useState<{ id_obra: number; nome: string }[]>([])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: contrato ? {
      id_trabalhador: contrato.id_trabalhador as number,
      id_obra: contrato.id_obra as number,
      tipo_pagamento: contrato.tipo_pagamento as string,
      valor_acordado: contrato.valor_acordado as number,
      data_inicio: contrato.data_inicio as string,
      data_fim: (contrato.data_fim as string) ?? "",
      observacoes: (contrato.observacoes as string) ?? "",
    } : { id_trabalhador: 0, id_obra: 0, tipo_pagamento: "", valor_acordado: 0, data_inicio: "" },
  })

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    Promise.all([
      supabase.from("trabalhador").select("id_trabalhador, nome").eq("ativo", true).order("nome"),
      supabase.from("obra").select("id_obra, nome").in("status", ["planejamento", "em_andamento"]).order("nome"),
    ]).then(([t, o]) => {
      setTrabalhadores((t.data ?? []) as { id_trabalhador: number; nome: string }[])
      setObras((o.data ?? []) as { id_obra: number; nome: string }[])
    })
  }, [open])

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    if (contrato) {
      const { error } = await supabase.from("contrato_trabalho").update(data).eq("id_contrato", contrato.id_contrato as number)
      if (error) { toast.error("Erro: " + error.message); return }
      toast.success("Contrato atualizado")
    } else {
      const { error } = await supabase.from("contrato_trabalho").insert(data)
      if (error) { toast.error("Erro: " + error.message); return }
      toast.success("Contrato criado")
    }
    reset(); onOpenChange(false); onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{contrato ? "Editar contrato" : "Novo contrato"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Trabalhador *</Label>
            <Select value={watch("id_trabalhador")?.toString() || ""} onValueChange={(v) => v && setValue("id_trabalhador", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{trabalhadores.map((t) => <SelectItem key={t.id_trabalhador} value={t.id_trabalhador.toString()}>{t.nome}</SelectItem>)}</SelectContent>
            </Select>
            {errors.id_trabalhador && <p className="text-sm text-red-600 mt-1">{errors.id_trabalhador.message}</p>}
          </div>
          <div>
            <Label>Obra *</Label>
            <Select value={watch("id_obra")?.toString() || ""} onValueChange={(v) => v && setValue("id_obra", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{obras.map((o) => <SelectItem key={o.id_obra} value={o.id_obra.toString()}>{o.nome}</SelectItem>)}</SelectContent>
            </Select>
            {errors.id_obra && <p className="text-sm text-red-600 mt-1">{errors.id_obra.message}</p>}
          </div>
          <div>
            <Label>Tipo de pagamento *</Label>
            <Select value={watch("tipo_pagamento") || ""} onValueChange={(v) => v && setValue("tipo_pagamento", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{Object.entries(TIPO_PAGAMENTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Valor acordado (R$) *</Label><Input {...register("valor_acordado", { valueAsNumber: true })} type="number" step="0.01" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Data início *</Label><Input {...register("data_inicio")} type="date" /></div>
            <div><Label>Data fim</Label><Input {...register("data_fim")} type="date" /></div>
          </div>
          <div><Label>Observações</Label><Textarea {...register("observacoes")} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
