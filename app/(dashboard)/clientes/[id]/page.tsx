"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClienteForm } from "@/components/forms/cliente-form"
import { StatusBadge } from "@/components/shared/status-badge"
import { ProgressBar } from "@/components/shared/progress-bar"
import { OBRA_STATUS } from "@/lib/constants"
import { formatCPFCNPJ, formatPhone, formatDate } from "@/lib/utils/format"
import { Pencil } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

type Cliente = Database["public"]["Tables"]["cliente"]["Row"]

interface ObraResumida {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  data_inicio_prevista: string | null
}

export default function ClientePerfilPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [obras, setObras] = useState<ObraResumida[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: c } = await supabase
      .from("cliente")
      .select("*")
      .eq("id_cliente", id)
      .single()
    setCliente(c)

    const { data: o } = await supabase
      .from("obra")
      .select("id_obra, nome, status, percentual_finalizada, data_inicio_prevista")
      .eq("id_cliente", id)
      .order("created_at", { ascending: false })
    setObras((o as ObraResumida[]) ?? [])
  }

  useEffect(() => { load() }, [params.id])

  if (!cliente) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{cliente.nome}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Button>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {cliente.cpf_cnpj && <p><strong>CPF/CNPJ:</strong> {formatCPFCNPJ(cliente.cpf_cnpj)}</p>}
          {cliente.telefone && <p><strong>Telefone:</strong> {formatPhone(cliente.telefone)}</p>}
          {cliente.email && <p><strong>E-mail:</strong> {cliente.email}</p>}
          {cliente.endereco && <p><strong>Endereço:</strong> {cliente.endereco}</p>}
          {cliente.observacoes && <p><strong>Obs:</strong> {cliente.observacoes}</p>}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Obras deste cliente</h2>
        {obras.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma obra vinculada.</p>
        ) : (
          <div className="space-y-2">
            {obras.map((o) => (
              <div
                key={o.id_obra}
                className="flex items-center justify-between border rounded-md p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/obras/${o.id_obra}`)}
              >
                <div>
                  <p className="font-medium">{o.nome}</p>
                  {o.data_inicio_prevista && <p className="text-xs text-muted-foreground">Início: {formatDate(o.data_inicio_prevista)}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} statusMap={OBRA_STATUS} />
                  <ProgressBar value={o.percentual_finalizada} className="w-24" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={cliente}
        onSuccess={load}
      />
    </div>
  )
}
