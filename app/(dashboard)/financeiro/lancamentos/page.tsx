"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { LancamentoForm } from "@/components/forms/lancamento-form"
import { LANCAMENTO_TIPO, ENTRADA_SAIDA } from "@/lib/constants"
import { formatBRL, formatDate } from "@/lib/utils/format"
import { Plus } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"

interface LancRow {
  id_lancamento: number; data_competencia: string; historico: string | null
  valor: number; tipo: string; entrada_saida: string
  obra_nome: string; fornecedor_nome: string; centro_custo_nome: string
}

export default function LancamentosPage() {
  const [data, setData] = useState<LancRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: lancs } = await supabase.from("lancamento").select("*").order("data_competencia", { ascending: false })
    const list = (lancs ?? []) as (LancRow & { id_obra: number; id_fornecedor: number | null; id_centro_custo: number })[]

    const obraIds = [...new Set(list.map(l => l.id_obra))]
    const fornIds = [...new Set(list.filter(l => l.id_fornecedor).map(l => l.id_fornecedor!))]
    const ccIds = [...new Set(list.map(l => l.id_centro_custo))]

    const [{ data: obras }, { data: forns }, { data: ccs }] = await Promise.all([
      supabase.from("obra").select("id_obra, nome").in("id_obra", obraIds.length ? obraIds : [0]),
      supabase.from("fornecedor").select("id_fornecedor, nome").in("id_fornecedor", fornIds.length ? fornIds : [0]),
      supabase.from("centro_custo").select("id_centro_custo, nome").in("id_centro_custo", ccIds.length ? ccIds : [0]),
    ])

    const obraMap = new Map((obras ?? []).map((o: { id_obra: number; nome: string }) => [o.id_obra, o.nome]))
    const fornMap = new Map((forns ?? []).map((f: { id_fornecedor: number; nome: string }) => [f.id_fornecedor, f.nome]))
    const ccMap = new Map((ccs ?? []).map((c: { id_centro_custo: number; nome: string }) => [c.id_centro_custo, c.nome]))

    setData(list.map(l => ({
      ...l,
      obra_nome: obraMap.get(l.id_obra) ?? "",
      fornecedor_nome: l.id_fornecedor ? fornMap.get(l.id_fornecedor) ?? "" : "",
      centro_custo_nome: ccMap.get(l.id_centro_custo) ?? "",
    })))
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalEntradas = data.filter(l => l.entrada_saida === "entrada").reduce((s, l) => s + l.valor, 0)
  const totalSaidas = data.filter(l => l.entrada_saida === "saida").reduce((s, l) => s + l.valor, 0)

  const columns: ColumnDef<LancRow>[] = [
    { accessorKey: "data_competencia", header: "Data", cell: ({ row }) => formatDate(row.getValue("data_competencia")) },
    { accessorKey: "obra_nome", header: "Obra" },
    { accessorKey: "historico", header: "Histórico", cell: ({ row }) => (row.getValue("historico") as string | null) || "—" },
    { accessorKey: "valor", header: "Valor", cell: ({ row }) => <span className="font-mono">{formatBRL(row.getValue("valor"))}</span> },
    { accessorKey: "tipo", header: "Tipo", cell: ({ row }) => <StatusBadge status={row.getValue("tipo")} statusMap={LANCAMENTO_TIPO} /> },
    { accessorKey: "entrada_saida", header: "E/S", cell: ({ row }) => {
      const v = row.getValue("entrada_saida") as string
      const config = ENTRADA_SAIDA[v as keyof typeof ENTRADA_SAIDA]
      return <span className={config?.color}>{config?.label ?? v}</span>
    }},
    { accessorKey: "fornecedor_nome", header: "Fornecedor" },
    { accessorKey: "centro_custo_nome", header: "Centro custo" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo lançamento</Button>
      </div>

      <div className="flex gap-4 text-sm">
        <span>Entradas: <strong className="text-green-600 font-mono">{formatBRL(totalEntradas)}</strong></span>
        <span>Saídas: <strong className="text-red-600 font-mono">{formatBRL(totalSaidas)}</strong></span>
        <span>Saldo: <strong className={`font-mono ${totalEntradas - totalSaidas >= 0 ? "text-green-600" : "text-red-600"}`}>{formatBRL(totalEntradas - totalSaidas)}</strong></span>
      </div>

      <DataTable columns={columns} data={data} searchKey="obra_nome" searchPlaceholder="Buscar por obra..." isLoading={isLoading} emptyMessage="Nenhum lançamento." />
      <LancamentoForm open={formOpen} onOpenChange={setFormOpen} onSuccess={load} />
    </div>
  )
}
