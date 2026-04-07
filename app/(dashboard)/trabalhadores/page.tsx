"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { TrabalhadorForm } from "@/components/forms/trabalhador-form"
import { ESPECIALIDADE } from "@/lib/constants"
import { Plus } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"

interface TrabRow {
  id_trabalhador: number
  nome: string
  cpf: string | null
  especialidade: string | null
  tipo_vinculo: string | null
  telefone: string | null
  ativo: boolean
}

const columns: ColumnDef<TrabRow>[] = [
  { accessorKey: "nome", header: "Nome" },
  { accessorKey: "cpf", header: "CPF" },
  {
    accessorKey: "especialidade",
    header: "Especialidade",
    cell: ({ row }) => {
      const v = row.getValue("especialidade") as string | null
      return v ? ESPECIALIDADE[v as keyof typeof ESPECIALIDADE] ?? v : "—"
    },
  },
  { accessorKey: "tipo_vinculo", header: "Vínculo" },
  { accessorKey: "telefone", header: "Telefone" },
  {
    accessorKey: "ativo",
    header: "Ativo",
    cell: ({ row }) => row.getValue("ativo") ? "Sim" : "Não",
  },
]

export default function TrabalhadoresPage() {
  const router = useRouter()
  const [data, setData] = useState<TrabRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("trabalhador").select("*").order("nome")
    setData((data ?? []) as TrabRow[])
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trabalhadores</h1>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo</Button>
      </div>
      <DataTable columns={columns} data={data} searchKey="nome" searchPlaceholder="Buscar por nome..." isLoading={isLoading} onRowClick={(row) => router.push(`/trabalhadores/${row.id_trabalhador}`)} emptyMessage="Nenhum trabalhador cadastrado." />
      <TrabalhadorForm open={formOpen} onOpenChange={setFormOpen} onSuccess={load} />
    </div>
  )
}
