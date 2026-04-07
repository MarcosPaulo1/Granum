"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { ResponsavelForm } from "@/components/forms/responsavel-form"
import { ROLES } from "@/lib/constants"
import { Plus } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"

interface ResponsavelRow {
  id_responsavel: number
  nome: string
  cargo: string | null
  departamento: string | null
  email: string | null
  ativo: boolean
  perfil_nome: string
}

const columns: ColumnDef<ResponsavelRow>[] = [
  { accessorKey: "nome", header: "Nome" },
  { accessorKey: "cargo", header: "Cargo" },
  { accessorKey: "departamento", header: "Departamento" },
  {
    accessorKey: "perfil_nome",
    header: "Perfil",
    cell: ({ row }) => {
      const nome = row.getValue("perfil_nome") as string
      return ROLES[nome as keyof typeof ROLES] ?? nome
    },
  },
  { accessorKey: "email", header: "E-mail" },
  {
    accessorKey: "ativo",
    header: "Ativo",
    cell: ({ row }) => row.getValue("ativo") ? "Sim" : "Não",
  },
]

export default function ResponsaveisPage() {
  const router = useRouter()
  const [data, setData] = useState<ResponsavelRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: resps } = await supabase
      .from("responsavel")
      .select("id_responsavel, nome, cargo, departamento, email, ativo, id_perfil")
      .order("nome")

    if (!resps) { setIsLoading(false); return }

    const { data: perfis } = await supabase.from("perfil").select("id_perfil, nome")
    const perfilMap = new Map((perfis ?? []).map((p) => [p.id_perfil, p.nome]))

    setData(
      resps.map((r) => ({
        ...r,
        perfil_nome: perfilMap.get(r.id_perfil) ?? "",
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Responsáveis</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo responsável
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/responsaveis/${row.id_responsavel}`)}
        emptyMessage="Nenhum responsável cadastrado."
      />

      <ResponsavelForm open={formOpen} onOpenChange={setFormOpen} onSuccess={load} />
    </div>
  )
}
