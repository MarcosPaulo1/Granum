"use client"

import { useCallback, useEffect, useState } from "react"
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
  cliente_nome: string
  responsavel_nome: string
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
    accessorKey: "cliente_nome",
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
    accessorKey: "responsavel_nome",
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

  const loadObras = useCallback(async () => {
    const supabase = createClient()
    const { data: obraList, error } = await supabase
      .from("obra")
      .select("id_obra, id_cliente, id_responsavel, nome, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao carregar obras:", error)
      setIsLoading(false)
      return
    }

    const list = obraList ?? []
    const clienteIds = [...new Set(list.map((o: { id_cliente: number }) => o.id_cliente))]
    const respIds = [...new Set(list.filter((o: { id_responsavel: number | null }) => o.id_responsavel).map((o: { id_responsavel: number }) => o.id_responsavel))]

    const [{ data: clientes }, { data: resps }] = await Promise.all([
      supabase.from("cliente").select("id_cliente, nome").in("id_cliente", clienteIds.length ? clienteIds : [0]),
      supabase.from("responsavel").select("id_responsavel, nome").in("id_responsavel", respIds.length ? respIds : [0]),
    ])

    const clienteMap = new Map((clientes ?? []).map((c: { id_cliente: number; nome: string }) => [c.id_cliente, c.nome]))
    const respMap = new Map((resps ?? []).map((r: { id_responsavel: number; nome: string }) => [r.id_responsavel, r.nome]))

    setObras(list.map((o: { id_obra: number; id_cliente: number; id_responsavel: number | null; nome: string; status: string; percentual_finalizada: number; data_inicio_prevista: string | null; data_fim_prevista: string | null }) => ({
      id_obra: o.id_obra,
      nome: o.nome,
      status: o.status,
      percentual_finalizada: o.percentual_finalizada,
      data_inicio_prevista: o.data_inicio_prevista,
      data_fim_prevista: o.data_fim_prevista,
      cliente_nome: clienteMap.get(o.id_cliente) ?? "",
      responsavel_nome: o.id_responsavel ? respMap.get(o.id_responsavel) ?? "" : "",
    })))
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadObras()
  }, [loadObras])

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
