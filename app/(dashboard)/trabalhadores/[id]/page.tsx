"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrabalhadorForm } from "@/components/forms/trabalhador-form"
import { StatusBadge } from "@/components/shared/status-badge"
import { CONTRATO_STATUS, ESPECIALIDADE, TIPO_VINCULO, TIPO_PAGAMENTO } from "@/lib/constants"
import { formatBRL, formatCPF, formatDate } from "@/lib/utils/format"
import { Pencil } from "lucide-react"

interface Trabalhador {
  id_trabalhador: number; nome: string; cpf: string | null; telefone: string | null
  especialidade: string | null; tipo_vinculo: string | null; pix_chave: string | null
  observacoes: string | null; ativo: boolean
}

interface Contrato {
  id_contrato: number; id_obra: number; tipo_pagamento: string; valor_acordado: number
  data_inicio: string; data_fim: string | null; status: string; obra_nome: string
}

export default function TrabalhadorPerfilPage() {
  const params = useParams()
  const [trab, setTrab] = useState<Trabalhador | null>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: t } = await supabase.from("trabalhador").select("*").eq("id_trabalhador", id).single()
    setTrab(t as Trabalhador | null)

    const { data: cts } = await supabase.from("contrato_trabalho").select("*").eq("id_trabalhador", id).order("data_inicio", { ascending: false })
    const contratosList = (cts ?? []) as (Contrato & { id_obra: number })[]

    // buscar nomes das obras
    const obraIds = [...new Set(contratosList.map(c => c.id_obra))]
    if (obraIds.length > 0) {
      const { data: obras } = await supabase.from("obra").select("id_obra, nome").in("id_obra", obraIds)
      const obrasMap = new Map((obras ?? []).map((o: { id_obra: number; nome: string }) => [o.id_obra, o.nome]))
      setContratos(contratosList.map(c => ({ ...c, obra_nome: obrasMap.get(c.id_obra) ?? "" })))
    } else {
      setContratos([])
    }
  }

  useEffect(() => { load() }, [params.id])

  if (!trab) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{trab.nome}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {trab.cpf && <p><strong>CPF:</strong> {formatCPF(trab.cpf)}</p>}
          {trab.telefone && <p><strong>Telefone:</strong> {trab.telefone}</p>}
          {trab.especialidade && <p><strong>Especialidade:</strong> {ESPECIALIDADE[trab.especialidade as keyof typeof ESPECIALIDADE] ?? trab.especialidade}</p>}
          {trab.tipo_vinculo && <p><strong>Vínculo:</strong> {TIPO_VINCULO[trab.tipo_vinculo as keyof typeof TIPO_VINCULO] ?? trab.tipo_vinculo}</p>}
          {trab.pix_chave && <p><strong>PIX:</strong> {trab.pix_chave}</p>}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Contratos</h2>
        {contratos.length === 0 ? <p className="text-muted-foreground text-sm">Nenhum contrato.</p> : (
          <div className="space-y-2">
            {contratos.map((c) => (
              <div key={c.id_contrato} className="flex items-center justify-between border rounded p-3">
                <div>
                  <p className="font-medium">{c.obra_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {TIPO_PAGAMENTO[c.tipo_pagamento as keyof typeof TIPO_PAGAMENTO] ?? c.tipo_pagamento} — {formatBRL(c.valor_acordado)} | {formatDate(c.data_inicio)} {c.data_fim ? `a ${formatDate(c.data_fim)}` : ""}
                  </p>
                </div>
                <StatusBadge status={c.status} statusMap={CONTRATO_STATUS} />
              </div>
            ))}
          </div>
        )}
      </div>

      <TrabalhadorForm open={formOpen} onOpenChange={setFormOpen} trabalhador={trab as unknown as Record<string, unknown>} onSuccess={load} />
    </div>
  )
}
