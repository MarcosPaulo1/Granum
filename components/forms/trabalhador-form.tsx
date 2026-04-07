"use client"

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
import { ESPECIALIDADE, TIPO_VINCULO } from "@/lib/constants"

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  especialidade: z.string().optional(),
  tipo_vinculo: z.string().optional(),
  pix_chave: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  trabalhador?: Record<string, unknown> | null
  onSuccess: () => void
}

export function TrabalhadorForm({ open, onOpenChange, trabalhador, onSuccess }: Props) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: trabalhador ? {
      nome: trabalhador.nome as string,
      cpf: (trabalhador.cpf as string) ?? "",
      telefone: (trabalhador.telefone as string) ?? "",
      especialidade: (trabalhador.especialidade as string) ?? "",
      tipo_vinculo: (trabalhador.tipo_vinculo as string) ?? "",
      pix_chave: (trabalhador.pix_chave as string) ?? "",
      observacoes: (trabalhador.observacoes as string) ?? "",
    } : {},
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    if (trabalhador) {
      const { error } = await supabase.from("trabalhador").update(data).eq("id_trabalhador", trabalhador.id_trabalhador as number)
      if (error) { toast.error("Erro ao atualizar"); return }
      toast.success("Trabalhador atualizado")
    } else {
      const { error } = await supabase.from("trabalhador").insert(data)
      if (error) { toast.error("Erro ao criar: " + error.message); return }
      toast.success("Trabalhador criado")
    }
    reset(); onOpenChange(false); onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{trabalhador ? "Editar trabalhador" : "Novo trabalhador"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label>Nome *</Label><Input {...register("nome")} />{errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>}</div>
          <div><Label>CPF</Label><Input {...register("cpf")} placeholder="000.000.000-00" /></div>
          <div><Label>Telefone</Label><Input {...register("telefone")} /></div>
          <div>
            <Label>Especialidade</Label>
            <Select value={watch("especialidade") || ""} onValueChange={(v) => v && setValue("especialidade", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(ESPECIALIDADE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de vínculo</Label>
            <Select value={watch("tipo_vinculo") || ""} onValueChange={(v) => v && setValue("tipo_vinculo", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_VINCULO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Chave PIX</Label><Input {...register("pix_chave")} /></div>
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
