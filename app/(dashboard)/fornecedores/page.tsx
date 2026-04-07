"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { FornecedorForm } from "@/components/forms/fornecedor-form"
import { Plus } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"
import type { Database } from "@/lib/supabase/types"

type Fornecedor = Database["public"]["Tables"]["fornecedor"]["Row"]

const columns: ColumnDef<Fornecedor>[] = [
  { accessorKey: "nome", header: "Nome" },
  { accessorKey: "cnpj", header: "CNPJ" },
  { accessorKey: "tipo", header: "Tipo" },
  { accessorKey: "contato", header: "Contato" },
  { accessorKey: "email", header: "E-mail" },
  {
    accessorKey: "ativo",
    header: "Ativo",
    cell: ({ row }) => (
      <span className={row.getValue("ativo") ? "text-green-600" : "text-red-600"}>
        {row.getValue("ativo") ? "Sim" : "Não"}
      </span>
    ),
  },
]

export default function FornecedoresPage() {
  const router = useRouter()
  const [data, setData] = useState<Fornecedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("fornecedor").select("*").order("nome")
    setData(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fornecedores</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo fornecedor
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/fornecedores/${row.id_fornecedor}`)}
        emptyMessage="Nenhum fornecedor cadastrado."
      />

      <FornecedorForm open={formOpen} onOpenChange={setFormOpen} onSuccess={load} />
    </div>
  )
}
