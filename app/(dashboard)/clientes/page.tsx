"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { ClienteForm } from "@/components/forms/cliente-form"
import { formatCPFCNPJ } from "@/lib/utils/format"
import { Plus } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"
import type { Database } from "@/lib/supabase/types"

type Cliente = Database["public"]["Tables"]["cliente"]["Row"]

const columns: ColumnDef<Cliente>[] = [
  { accessorKey: "nome", header: "Nome" },
  {
    accessorKey: "cpf_cnpj",
    header: "CPF/CNPJ",
    cell: ({ row }) => {
      const v = row.getValue("cpf_cnpj") as string | null
      return v ? formatCPFCNPJ(v) : "—"
    },
  },
  { accessorKey: "telefone", header: "Telefone" },
  { accessorKey: "email", header: "E-mail" },
]

export default function ClientesPage() {
  const router = useRouter()
  const [data, setData] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("cliente").select("*").order("nome")
    setData(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/clientes/${row.id_cliente}`)}
        emptyMessage="Nenhum cliente cadastrado."
      />

      <ClienteForm open={formOpen} onOpenChange={setFormOpen} onSuccess={load} />
    </div>
  )
}
