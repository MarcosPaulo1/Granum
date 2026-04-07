"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

type Fornecedor = Database["public"]["Tables"]["fornecedor"]["Row"]

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contato: z.string().optional(),
  tipo: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  fornecedor?: Fornecedor | null
  onSuccess: () => void
}

export function FornecedorForm({ open, onOpenChange, fornecedor, onSuccess }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: fornecedor ? {
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj ?? "",
      email: fornecedor.email ?? "",
      contato: fornecedor.contato ?? "",
      tipo: fornecedor.tipo ?? "",
      observacoes: fornecedor.observacoes ?? "",
    } : {},
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()

    if (fornecedor) {
      const { error } = await supabase.from("fornecedor").update(data).eq("id_fornecedor", fornecedor.id_fornecedor)
      if (error) { toast.error("Erro ao atualizar"); return }
      toast.success("Fornecedor atualizado")
    } else {
      const { error } = await supabase.from("fornecedor").insert(data)
      if (error) { toast.error("Erro ao criar"); return }
      toast.success("Fornecedor criado")
    }

    reset()
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fornecedor ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input {...register("nome")} />
            {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input {...register("email")} type="email" />
          </div>
          <div>
            <Label>Contato</Label>
            <Input {...register("contato")} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Input {...register("tipo")} placeholder="Material, serviço, equipamento..." />
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
