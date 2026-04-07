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

type Cliente = Database["public"]["Tables"]["cliente"]["Row"]

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf_cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ClienteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: Cliente | null
  onSuccess: () => void
}

export function ClienteForm({ open, onOpenChange, cliente, onSuccess }: ClienteFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: cliente ? {
      nome: cliente.nome,
      cpf_cnpj: cliente.cpf_cnpj ?? "",
      telefone: cliente.telefone ?? "",
      email: cliente.email ?? "",
      endereco: cliente.endereco ?? "",
      observacoes: cliente.observacoes ?? "",
    } : {},
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()

    if (cliente) {
      const { error } = await supabase
        .from("cliente")
        .update(data)
        .eq("id_cliente", cliente.id_cliente)

      if (error) { toast.error("Erro ao atualizar cliente"); return }
      toast.success("Cliente atualizado")
    } else {
      const { error } = await supabase.from("cliente").insert(data)
      if (error) { toast.error("Erro ao criar cliente"); return }
      toast.success("Cliente criado")
    }

    reset()
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input {...register("nome")} />
            {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label>CPF/CNPJ</Label>
            <Input {...register("cpf_cnpj")} placeholder="000.000.000-00" />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input {...register("telefone")} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input {...register("email")} type="email" />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Endereço</Label>
            <Input {...register("endereco")} />
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
