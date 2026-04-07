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
  id_cliente: z.number().min(1, "Selecione um cliente"),
  id_centro_custo: z.number().min(1, "Selecione um centro de custo"),
  id_responsavel: z.number().min(1, "Selecione um responsável"),
  data_inicio_prevista: z.string().optional(),
  data_fim_prevista: z.string().optional(),
  endereco: z.string().optional(),
  descricao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  obra?: Record<string, unknown> | null
  onSuccess: () => void
}

export function ObraForm({ open, onOpenChange, obra, onSuccess }: Props) {
  const [clientes, setClientes] = useState<{ id_cliente: number; nome: string }[]>([])
  const [centros, setCentros] = useState<{ id_centro_custo: number; codigo: string; nome: string }[]>([])
  const [responsaveis, setResponsaveis] = useState<{ id_responsavel: number; nome: string }[]>([])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: obra ? {
      nome: obra.nome as string,
      id_cliente: obra.id_cliente as number,
      id_centro_custo: obra.id_centro_custo as number,
      id_responsavel: obra.id_responsavel as number,
      data_inicio_prevista: (obra.data_inicio_prevista as string) ?? "",
      data_fim_prevista: (obra.data_fim_prevista as string) ?? "",
      endereco: (obra.endereco as string) ?? "",
      descricao: (obra.descricao as string) ?? "",
    } : { id_cliente: 0, id_centro_custo: 0, id_responsavel: 0 },
  })

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    Promise.all([
      supabase.from("cliente").select("id_cliente, nome").order("nome"),
      supabase.from("centro_custo").select("id_centro_custo, codigo, nome").eq("ativo", true).order("nome"),
      supabase.from("responsavel").select("id_responsavel, nome").eq("ativo", true).order("nome"),
    ]).then(([c, cc, r]) => {
      setClientes((c.data ?? []) as { id_cliente: number; nome: string }[])
      setCentros((cc.data ?? []) as { id_centro_custo: number; codigo: string; nome: string }[])
      setResponsaveis((r.data ?? []) as { id_responsavel: number; nome: string }[])
    })
  }, [open])

  async function onSubmit(data: FormData) {
    const supabase = createClient()

    if (obra) {
      const { error } = await supabase.from("obra").update(data).eq("id_obra", obra.id_obra as number)
      if (error) { toast.error("Erro ao atualizar obra"); return }
      toast.success("Obra atualizada")
    } else {
      const { error } = await supabase.from("obra").insert({ ...data, status: "planejamento" })
      if (error) { toast.error("Erro ao criar obra: " + error.message); return }
      toast.success("Obra criada")
    }

    reset()
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{obra ? "Editar obra" : "Nova obra"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input {...register("nome")} />
            {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label>Cliente *</Label>
            <Select value={watch("id_cliente")?.toString() || ""} onValueChange={(v) => v && setValue("id_cliente", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {clientes.map((c) => <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.id_cliente && <p className="text-sm text-red-600 mt-1">{errors.id_cliente.message}</p>}
          </div>
          <div>
            <Label>Centro de custo *</Label>
            <Select value={watch("id_centro_custo")?.toString() || ""} onValueChange={(v) => v && setValue("id_centro_custo", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {centros.map((c) => <SelectItem key={c.id_centro_custo} value={c.id_centro_custo.toString()}>{c.codigo} - {c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.id_centro_custo && <p className="text-sm text-red-600 mt-1">{errors.id_centro_custo.message}</p>}
          </div>
          <div>
            <Label>Responsável *</Label>
            <Select value={watch("id_responsavel")?.toString() || ""} onValueChange={(v) => v && setValue("id_responsavel", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {responsaveis.map((r) => <SelectItem key={r.id_responsavel} value={r.id_responsavel.toString()}>{r.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.id_responsavel && <p className="text-sm text-red-600 mt-1">{errors.id_responsavel.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Início previsto</Label>
              <Input {...register("data_inicio_prevista")} type="date" />
            </div>
            <div>
              <Label>Fim previsto</Label>
              <Input {...register("data_fim_prevista")} type="date" />
            </div>
          </div>
          <div>
            <Label>Endereço</Label>
            <Input {...register("endereco")} />
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
