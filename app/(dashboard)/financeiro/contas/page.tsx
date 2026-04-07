"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { PARCELA_STATUS } from "@/lib/constants"
import { formatBRL, formatDate } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { type ColumnDef } from "@tanstack/react-table"

interface ContaRow {
  id_parcela: number; id_lancamento: number; numero: number; valor: number
  data_vencimento: string; status: string; data_pagamento: string | null
  historico: string | null; id_obra: number; fornecedor: string | null
  obra: string; status_real: string; dias_para_vencer: number
}

export default function ContasPage() {
  const [data, setData] = useState<ContaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: contas } = await supabase.from("vw_contas_a_pagar").select("*").order("data_vencimento")
    setData((contas ?? []) as ContaRow[])
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function marcarPago(id: number) {
    const supabase = createClient()
    const today = new Date().toISOString().split("T")[0]
    await supabase.from("parcela").update({ status: "pago", data_pagamento: today }).eq("id_parcela", id)
    toast.success("Parcela marcada como paga")
    load()
  }

  const columns: ColumnDef<ContaRow>[] = [
    { accessorKey: "fornecedor", header: "Fornecedor", cell: ({ row }) => row.getValue("fornecedor") || "—" },
    { accessorKey: "obra", header: "Obra" },
    { accessorKey: "historico", header: "Histórico", cell: ({ row }) => (row.getValue("historico") as string | null) || "—" },
    { accessorKey: "numero", header: "Parc.", cell: ({ row }) => `${row.getValue("numero")}` },
    { accessorKey: "valor", header: "Valor", cell: ({ row }) => <span className="font-mono">{formatBRL(row.getValue("valor"))}</span> },
    { accessorKey: "data_vencimento", header: "Vencimento", cell: ({ row }) => formatDate(row.getValue("data_vencimento")) },
    { accessorKey: "dias_para_vencer", header: "Dias", cell: ({ row }) => {
      const d = row.getValue("dias_para_vencer") as number
      return <span className={d < 0 ? "text-red-600 font-semibold" : ""}>{d}d</span>
    }},
    { accessorKey: "status_real", header: "Status", cell: ({ row }) => <StatusBadge status={row.getValue("status_real")} statusMap={PARCELA_STATUS} /> },
    { id: "acoes", header: "", cell: ({ row }) => {
      if (row.original.status === "pago") return null
      return <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); marcarPago(row.original.id_parcela) }}>Pagar</Button>
    }},
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Contas a pagar</h1>
      <DataTable columns={columns} data={data} searchKey="fornecedor" searchPlaceholder="Buscar por fornecedor..." isLoading={isLoading} emptyMessage="Nenhuma conta pendente." />
    </div>
  )
}
