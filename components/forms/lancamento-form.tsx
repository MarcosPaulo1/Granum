"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { formatBRL } from "@/lib/utils/format"
import { addMonths, format } from "date-fns"

const schema = z.object({
  id_obra: z.number().min(1, "Selecione uma obra"),
  id_centro_custo: z.number().min(1, "Centro de custo obrigatório"),
  valor: z.number().positive("Valor deve ser positivo"),
  tipo: z.string().min(1, "Selecione o tipo"),
  entrada_saida: z.string().min(1, "Selecione entrada/saída"),
  data_competencia: z.string().min(1, "Data obrigatória"),
  id_tarefa: z.number().optional(),
  id_grupo_movimento: z.number().optional(),
  id_plano_conta: z.number().optional(),
  id_fornecedor: z.number().optional(),
  forma_pagamento: z.string().optional(),
  data_pagamento: z.string().optional(),
  historico: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultObraId?: number
}

export function LancamentoForm({ open, onOpenChange, onSuccess, defaultObraId }: Props) {
  const { responsavel } = useUser()
  const [obras, setObras] = useState<{ id_obra: number; nome: string }[]>([])
  const [centros, setCentros] = useState<{ id_centro_custo: number; codigo: string; nome: string }[]>([])
  const [tarefas, setTarefas] = useState<{ id_tarefa: number; nome: string }[]>([])
  const [grupos, setGrupos] = useState<{ id_grupo: number; nome: string }[]>([])
  const [planos, setPlanos] = useState<{ id_plano: number; codigo: string | null; nome: string; analitica: boolean }[]>([])
  const [fornecedores, setFornecedores] = useState<{ id_fornecedor: number; nome: string }[]>([])
  const [parcelado, setParcelado] = useState(false)
  const [numParcelas, setNumParcelas] = useState(2)
  const [dataVencimento, setDataVencimento] = useState("")

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { id_obra: defaultObraId ?? 0, id_centro_custo: 0, valor: 0, tipo: "", entrada_saida: "", data_competencia: "" },
  })

  const obraId = watch("id_obra")
  const valor = watch("valor")

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    Promise.all([
      supabase.from("obra").select("id_obra, nome").in("status", ["planejamento", "em_andamento"]).order("nome"),
      supabase.from("centro_custo").select("id_centro_custo, codigo, nome").eq("ativo", true).order("nome"),
      supabase.from("grupo_movimento").select("id_grupo, nome").order("nome"),
      supabase.from("plano_conta").select("id_plano, codigo, nome, analitica").eq("analitica", true).order("codigo"),
      supabase.from("fornecedor").select("id_fornecedor, nome").eq("ativo", true).order("nome"),
    ]).then(([o, c, g, p, f]) => {
      setObras((o.data ?? []) as typeof obras)
      setCentros((c.data ?? []) as typeof centros)
      setGrupos((g.data ?? []) as typeof grupos)
      setPlanos((p.data ?? []) as typeof planos)
      setFornecedores((f.data ?? []) as typeof fornecedores)
    })
  }, [open])

  // Carregar tarefas quando obra muda
  useEffect(() => {
    if (!obraId) { setTarefas([]); return }
    const supabase = createClient()
    supabase.from("tarefa").select("id_tarefa, nome").eq("id_obra", obraId).order("nome").then(({ data }) => {
      setTarefas((data ?? []) as typeof tarefas)
    })
  }, [obraId])

  function gerarParcelas(): { numero: number; valor: number; data_vencimento: string }[] {
    if (!parcelado || numParcelas < 2 || !dataVencimento || !valor) return []
    const valorParcela = Math.round((valor / numParcelas) * 100) / 100
    const resto = Math.round((valor - valorParcela * numParcelas) * 100) / 100
    return Array.from({ length: numParcelas }, (_, i) => ({
      numero: i + 1,
      valor: i === 0 ? valorParcela + resto : valorParcela,
      data_vencimento: format(addMonths(new Date(dataVencimento + "T12:00:00"), i), "yyyy-MM-dd"),
    }))
  }

  const previewParcelas = gerarParcelas()

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const payload = {
      ...data,
      id_responsavel: responsavel?.id_responsavel ?? 1,
      id_tarefa: data.id_tarefa || null,
      id_grupo_movimento: data.id_grupo_movimento || null,
      id_plano_conta: data.id_plano_conta || null,
      id_fornecedor: data.id_fornecedor || null,
    }

    const { data: lanc, error } = await supabase.from("lancamento").insert(payload).select("id_lancamento").single()
    if (error) { toast.error("Erro: " + error.message); return }

    const lancId = (lanc as { id_lancamento: number }).id_lancamento

    // Criar parcelas se parcelado
    if (parcelado && previewParcelas.length > 0) {
      const parcelas = previewParcelas.map(p => ({ ...p, id_lancamento: lancId }))
      const { error: pErr } = await supabase.from("parcela").insert(parcelas)
      if (pErr) { toast.error("Lançamento criado, mas erro nas parcelas: " + pErr.message); return }
    }

    toast.success(`Lançamento criado${parcelado ? ` com ${numParcelas} parcelas` : ""}`)
    reset(); setParcelado(false); onOpenChange(false); onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Obra *</Label>
              <Select value={watch("id_obra")?.toString() || ""} onValueChange={(v) => v && setValue("id_obra", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{obras.map((o) => <SelectItem key={o.id_obra} value={o.id_obra.toString()}>{o.nome}</SelectItem>)}</SelectContent>
              </Select>
              {errors.id_obra && <p className="text-sm text-red-600 mt-1">{errors.id_obra.message}</p>}
            </div>
            <div>
              <Label>Centro de custo *</Label>
              <Select value={watch("id_centro_custo")?.toString() || ""} onValueChange={(v) => v && setValue("id_centro_custo", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{centros.map((c) => <SelectItem key={c.id_centro_custo} value={c.id_centro_custo.toString()}>{c.codigo} - {c.nome}</SelectItem>)}</SelectContent>
              </Select>
              {errors.id_centro_custo && <p className="text-sm text-red-600 mt-1">{errors.id_centro_custo.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Valor (R$) *</Label>
              <Input {...register("valor", { valueAsNumber: true })} type="number" step="0.01" />
              {errors.valor && <p className="text-sm text-red-600 mt-1">{errors.valor.message}</p>}
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={watch("tipo") || ""} onValueChange={(v) => v && setValue("tipo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejado">Planejado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Entrada/Saída *</Label>
              <Select value={watch("entrada_saida") || ""} onValueChange={(v) => v && setValue("entrada_saida", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><Label>Data competência *</Label><Input {...register("data_competencia")} type="date" />{errors.data_competencia && <p className="text-sm text-red-600 mt-1">{errors.data_competencia.message}</p>}</div>
            <div><Label>Data pagamento</Label><Input {...register("data_pagamento")} type="date" /></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tarefa (opcional)</Label>
              <Select value={watch("id_tarefa")?.toString() || ""} onValueChange={(v) => v && setValue("id_tarefa", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>{tarefas.map((t) => <SelectItem key={t.id_tarefa} value={t.id_tarefa.toString()}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grupo de movimento</Label>
              <Select value={watch("id_grupo_movimento")?.toString() || ""} onValueChange={(v) => v && setValue("id_grupo_movimento", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{grupos.map((g) => <SelectItem key={g.id_grupo} value={g.id_grupo.toString()}>{g.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Plano de contas</Label>
              <Select value={watch("id_plano_conta")?.toString() || ""} onValueChange={(v) => v && setValue("id_plano_conta", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{planos.map((p) => <SelectItem key={p.id_plano} value={p.id_plano.toString()}>{p.codigo} - {p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Select value={watch("id_fornecedor")?.toString() || ""} onValueChange={(v) => v && setValue("id_fornecedor", Number(v))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>{fornecedores.map((f) => <SelectItem key={f.id_fornecedor} value={f.id_fornecedor.toString()}>{f.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div><Label>Forma de pagamento</Label><Input {...register("forma_pagamento")} placeholder="PIX, boleto, cartão..." /></div>
          <div><Label>Histórico</Label><Textarea {...register("historico")} /></div>

          {/* Parcelamento */}
          <div className="border rounded p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={parcelado} onCheckedChange={(v) => setParcelado(!!v)} />
              <Label>Pagamento parcelado</Label>
            </div>
            {parcelado && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nº de parcelas</Label><Input type="number" min={2} value={numParcelas} onChange={(e) => setNumParcelas(Number(e.target.value))} /></div>
                  <div><Label>1º vencimento</Label><Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} /></div>
                </div>
                {previewParcelas.length > 0 && (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Preview:</p>
                    {previewParcelas.map((p) => (
                      <div key={p.numero} className="flex justify-between text-muted-foreground">
                        <span>Parcela {p.numero}</span>
                        <span>{p.data_vencimento.split("-").reverse().join("/")}</span>
                        <span className="font-mono">{formatBRL(p.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
