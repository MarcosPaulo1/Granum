"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { ContratoForm } from "@/components/forms/contrato-form"
import { CONTRATO_STATUS, TIPO_PAGAMENTO } from "@/lib/constants"
import { formatBRL, formatDate } from "@/lib/utils/format"
import { Plus } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface ContratoRow {
  id_contrato: number; id_trabalhador: number; id_obra: number
  tipo_pagamento: string; valor_acordado: number; data_inicio: string
  data_fim: string | null; status: string; trabalhador_nome: string; obra_nome: string
}

export default function ContratosPage() {
  const [data, setData] = useState<ContratoRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [encerrarId, setEncerrarId] = useState<number | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: cts } = await supabase.from("contrato_trabalho").select("*").order("data_inicio", { ascending: false })
    const contratos = (cts ?? []) as ContratoRow[]

    const trabIds = [...new Set(contratos.map(c => c.id_trabalhador))]
    const obraIds = [...new Set(contratos.map(c => c.id_obra))]

    const [{ data: trabs }, { data: obras }] = await Promise.all([
      supabase.from("trabalhador").select("id_trabalhador, nome").in("id_trabalhador", trabIds.length ? trabIds : [0]),
      supabase.from("obra").select("id_obra, nome").in("id_obra", obraIds.length ? obraIds : [0]),
    ])

    const trabMap = new Map((trabs ?? []).map((t: { id_trabalhador: number; nome: string }) => [t.id_trabalhador, t.nome]))
    const obraMap = new Map((obras ?? []).map((o: { id_obra: number; nome: string }) => [o.id_obra, o.nome]))

    setData(contratos.map(c => ({ ...c, trabalhador_nome: trabMap.get(c.id_trabalhador) ?? "", obra_nome: obraMap.get(c.id_obra) ?? "" })))
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function encerrarContrato() {
    if (!encerrarId) return
    const supabase = createClient()
    await supabase.from("contrato_trabalho").update({ status: "encerrado", data_fim: new Date().toISOString().split("T")[0] }).eq("id_contrato", encerrarId)
    // Cancelar escalas futuras
    const today = new Date().toISOString().split("T")[0]
    await supabase.from("escala").update({ status: "cancelado" }).eq("id_contrato", encerrarId).gte("data_prevista", today)
    toast.success("Contrato encerrado e escalas futuras canceladas")
    setEncerrarId(null)
    load()
  }

  const columns: ColumnDef<ContratoRow>[] = [
    { accessorKey: "trabalhador_nome", header: "Trabalhador" },
    { accessorKey: "obra_nome", header: "Obra" },
    { accessorKey: "tipo_pagamento", header: "Tipo", cell: ({ row }) => TIPO_PAGAMENTO[row.getValue("tipo_pagamento") as keyof typeof TIPO_PAGAMENTO] ?? row.getValue("tipo_pagamento") },
    { accessorKey: "valor_acordado", header: "Valor", cell: ({ row }) => formatBRL(row.getValue("valor_acordado")) },
    { accessorKey: "data_inicio", header: "Início", cell: ({ row }) => formatDate(row.getValue("data_inicio")) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <StatusBadge status={row.getValue("status")} statusMap={CONTRATO_STATUS} />
        {row.getValue("status") === "ativo" && <Button variant="ghost" size="sm" className="text-xs text-red-600" onClick={(e) => { e.stopPropagation(); setEncerrarId(row.original.id_contrato) }}>Encerrar</Button>}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contratos de trabalho</h1>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo contrato</Button>
      </div>
      <DataTable columns={columns} data={data} searchKey="trabalhador_nome" searchPlaceholder="Buscar por trabalhador..." isLoading={isLoading} emptyMessage="Nenhum contrato." />
      <ContratoForm open={formOpen} onOpenChange={setFormOpen} onSuccess={load} />
      <ConfirmDialog open={!!encerrarId} onOpenChange={() => setEncerrarId(null)} title="Encerrar contrato?" description="Escalas futuras serão canceladas automaticamente." confirmLabel="Encerrar" onConfirm={encerrarContrato} variant="destructive" />
    </div>
  )
}
