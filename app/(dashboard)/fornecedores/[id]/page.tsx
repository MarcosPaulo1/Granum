"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FornecedorForm } from "@/components/forms/fornecedor-form"
import { formatBRL, formatDate } from "@/lib/utils/format"
import { Pencil } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

type Fornecedor = Database["public"]["Tables"]["fornecedor"]["Row"]

interface LancamentoResumido {
  id_lancamento: number
  data_competencia: string
  historico: string | null
  valor: number
  id_obra: number
  obra_nome: string
}

export default function FornecedorPerfilPage() {
  const params = useParams()
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [lancamentos, setLancamentos] = useState<LancamentoResumido[]>([])
  const [totalPago, setTotalPago] = useState(0)
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: f } = await supabase.from("fornecedor").select("*").eq("id_fornecedor", id).single()
    setFornecedor(f)

    const { data: lancs } = await supabase
      .from("lancamento")
      .select("id_lancamento, data_competencia, historico, valor, id_obra")
      .eq("id_fornecedor", id)
      .eq("tipo", "realizado")
      .order("data_competencia", { ascending: false })

    const lancsList = (lancs ?? []) as (LancamentoResumido & { id_obra: number })[]
    const obraIds = [...new Set(lancsList.map(l => l.id_obra))]
    const { data: obras } = await supabase.from("obra").select("id_obra, nome").in("id_obra", obraIds.length ? obraIds : [0])
    const obraMap = new Map((obras ?? []).map((o: { id_obra: number; nome: string }) => [o.id_obra, o.nome]))

    const items = lancsList.map(l => ({ ...l, obra_nome: obraMap.get(l.id_obra) ?? "" }))
    setLancamentos(items)
    setTotalPago(items.reduce((sum, l) => sum + l.valor, 0))
  }

  useEffect(() => { load() }, [params.id])

  if (!fornecedor) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{fornecedor.nome}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Button>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {fornecedor.cnpj && <p><strong>CNPJ:</strong> {fornecedor.cnpj}</p>}
          {fornecedor.email && <p><strong>E-mail:</strong> {fornecedor.email}</p>}
          {fornecedor.contato && <p><strong>Contato:</strong> {fornecedor.contato}</p>}
          {fornecedor.tipo && <p><strong>Tipo:</strong> {fornecedor.tipo}</p>}
          <p><strong>Total pago:</strong> {formatBRL(totalPago)}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Lançamentos</h2>
        {lancamentos.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum lançamento vinculado.</p>
        ) : (
          <div className="space-y-2">
            {lancamentos.map((l) => (
              <div key={l.id_lancamento} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="text-sm">{l.historico || "Sem histórico"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(l.data_competencia)} {l.obra_nome && `— ${l.obra_nome}`}</p>
                </div>
                <p className="font-mono font-medium">{formatBRL(l.valor)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <FornecedorForm open={formOpen} onOpenChange={setFormOpen} fornecedor={fornecedor} onSuccess={load} />
    </div>
  )
}
