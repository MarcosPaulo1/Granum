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
import type { Database } from "@/lib/supabase/types"

type Responsavel = Database["public"]["Tables"]["responsavel"]["Row"]
type Perfil = Database["public"]["Tables"]["perfil"]["Row"]

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  id_perfil: z.number().min(1, "Selecione um perfil"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  telefone_whatsapp: z.string().optional(),
  departamento: z.string().optional(),
  cargo: z.string().optional(),
  data_admissao: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  responsavel?: Responsavel | null
  onSuccess: () => void
}

export function ResponsavelForm({ open, onOpenChange, responsavel, onSuccess }: Props) {
  const [perfis, setPerfis] = useState<Perfil[]>([])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: responsavel ? {
      nome: responsavel.nome,
      id_perfil: responsavel.id_perfil,
      email: responsavel.email ?? "",
      telefone: responsavel.telefone ?? "",
      telefone_whatsapp: responsavel.telefone_whatsapp ?? "",
      departamento: responsavel.departamento ?? "",
      cargo: responsavel.cargo ?? "",
      data_admissao: responsavel.data_admissao ?? "",
      observacoes: responsavel.observacoes ?? "",
    } : { id_perfil: 0 },
  })

  useEffect(() => {
    async function loadPerfis() {
      const supabase = createClient()
      const { data } = await supabase.from("perfil").select("*").order("nome")
      setPerfis(data ?? [])
    }
    if (open) loadPerfis()
  }, [open])

  async function onSubmit(data: FormData) {
    const supabase = createClient()

    if (responsavel) {
      const { error } = await supabase.from("responsavel").update(data).eq("id_responsavel", responsavel.id_responsavel)
      if (error) { toast.error("Erro ao atualizar"); return }
      toast.success("Responsável atualizado")
    } else {
      const { error } = await supabase.from("responsavel").insert(data)
      if (error) { toast.error("Erro ao criar"); return }
      toast.success("Responsável criado")
    }

    reset()
    onOpenChange(false)
    onSuccess()
  }

  const perfilValue = watch("id_perfil")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{responsavel ? "Editar responsável" : "Novo responsável"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input {...register("nome")} />
            {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label>Perfil *</Label>
            <Select
              value={perfilValue ? perfilValue.toString() : ""}
              onValueChange={(v) => v && setValue("id_perfil", Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                {perfis.map((p) => (
                  <SelectItem key={p.id_perfil} value={p.id_perfil.toString()}>
                    {p.descricao || p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_perfil && <p className="text-sm text-red-600 mt-1">{errors.id_perfil.message}</p>}
          </div>
          <div>
            <Label>E-mail</Label>
            <Input {...register("email")} type="email" />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input {...register("telefone")} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input {...register("telefone_whatsapp")} />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input {...register("cargo")} />
          </div>
          <div>
            <Label>Departamento</Label>
            <Input {...register("departamento")} />
          </div>
          <div>
            <Label>Data de admissão</Label>
            <Input {...register("data_admissao")} type="date" />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea {...register("observacoes")} />
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
