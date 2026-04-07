"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { DataTable } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { ProgressBar } from "@/components/shared/progress-bar"
import { Button } from "@/components/ui/button"
import { OBRA_STATUS } from "@/lib/constants"
import { formatDate } from "@/lib/utils/format"
import { Plus } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"
import { PageSkeleton } from "@/components/shared/loading-skeleton"

interface ObraRow {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  data_inicio_prevista: string | null
  data_fim_prevista: string | null
  cliente: { nome: string } | null
  responsavel: { nome: string } | null
}

const columns: ColumnDef<ObraRow>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("nome")}</span>
    ),
  },
  {
    accessorFn: (row) => row.cliente?.nome,
    id: "cliente",
    header: "Cliente",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.getValue("status")} statusMap={OBRA_STATUS} />
    ),
  },
  {
    accessorKey: "percentual_finalizada",
    header: "Progresso",
    cell: ({ row }) => (
      <ProgressBar value={row.getValue("percentual_finalizada")} className="w-32" />
    ),
  },
  {
    accessorFn: (row) => row.responsavel?.nome,
    id: "responsavel",
    header: "Responsável",
  },
  {
    accessorKey: "data_inicio_prevista",
    header: "Início",
    cell: ({ row }) => {
      const val = row.getValue("data_inicio_prevista") as string | null
      return val ? formatDate(val) : "—"
    },
  },
  {
    accessorKey: "data_fim_prevista",
    header: "Previsão fim",
    cell: ({ row }) => {
      const val = row.getValue("data_fim_prevista") as string | null
      return val ? formatDate(val) : "—"
    },
  },
]

export default function ObrasPage() {
  const router = useRouter()
  const { role, isLoading: userLoading } = useUser()
  const [obras, setObras] = useState<ObraRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadObras() {
      const supabase = createClient()
      const { data } = await supabase
        .from("obra")
        .select("id_obra, nome, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista, cliente(nome), responsavel(nome)")
        .order("created_at", { ascending: false })

      setObras((data as unknown as ObraRow[]) ?? [])
      setIsLoading(false)
    }

    loadObras()
  }, [])

  if (userLoading || isLoading) return <PageSkeleton />

  const canCreate = role === "diretor" || role === "arquiteta"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Obras</h1>
        {canCreate && (
          <Button onClick={() => router.push("/obras/nova")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova obra
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={obras}
        searchKey="nome"
        searchPlaceholder="Buscar por nome da obra..."
        onRowClick={(row) => router.push(`/obras/${row.id_obra}`)}
        emptyMessage="Nenhuma obra cadastrada. Crie a primeira."
      />
    </div>
  )
}
