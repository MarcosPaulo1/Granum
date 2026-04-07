"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsavelForm } from "@/components/forms/responsavel-form"
import { StatusBadge } from "@/components/shared/status-badge"
import { OBRA_STATUS, TAREFA_STATUS, ROLES } from "@/lib/constants"
import { formatDate } from "@/lib/utils/format"
import { Pencil } from "lucide-react"
import type { Database } from "@/lib/supabase/types"

type Responsavel = Database["public"]["Tables"]["responsavel"]["Row"]

export default function ResponsavelPerfilPage() {
  const params = useParams()
  const router = useRouter()
  const [responsavel, setResponsavel] = useState<Responsavel | null>(null)
  const [perfilNome, setPerfilNome] = useState("")
  const [obras, setObras] = useState<{ id_obra: number; nome: string; status: string }[]>([])
  const [tarefas, setTarefas] = useState<{ id_tarefa: number; nome: string; status: string }[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: r } = await supabase.from("responsavel").select("*").eq("id_responsavel", id).single()
    setResponsavel(r as Responsavel | null)

    if (r) {
      const { data: p } = await supabase.from("perfil").select("nome").eq("id_perfil", r.id_perfil).single()
      setPerfilNome((p as { nome: string } | null)?.nome ?? "")
    }

    const { data: o } = await supabase.from("obra").select("id_obra, nome, status").eq("id_responsavel", id)
    setObras((o ?? []) as { id_obra: number; nome: string; status: string }[])

    const { data: t } = await supabase.from("tarefa").select("id_tarefa, nome, status").eq("id_responsavel", id).order("created_at", { ascending: false }).limit(20)
    setTarefas((t ?? []) as { id_tarefa: number; nome: string; status: string }[])
  }

  useEffect(() => { load() }, [params.id])

  if (!responsavel) return <p>Carregando...</p>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{responsavel.nome}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Button>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><strong>Perfil:</strong> {ROLES[perfilNome as keyof typeof ROLES] ?? perfilNome}</p>
          {responsavel.cargo && <p><strong>Cargo:</strong> {responsavel.cargo}</p>}
          {responsavel.email && <p><strong>E-mail:</strong> {responsavel.email}</p>}
          {responsavel.telefone && <p><strong>Telefone:</strong> {responsavel.telefone}</p>}
          {responsavel.departamento && <p><strong>Depto:</strong> {responsavel.departamento}</p>}
          {responsavel.data_admissao && <p><strong>Admissão:</strong> {formatDate(responsavel.data_admissao)}</p>}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Obras atribuídas</h2>
        {obras.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma obra atribuída.</p>
        ) : (
          <div className="space-y-2">
            {obras.map((o) => (
              <div key={o.id_obra} className="flex items-center justify-between border rounded-md p-3 cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/obras/${o.id_obra}`)}>
                <span className="font-medium">{o.nome}</span>
                <StatusBadge status={o.status} statusMap={OBRA_STATUS} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Tarefas atribuídas</h2>
        {tarefas.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma tarefa atribuída.</p>
        ) : (
          <div className="space-y-2">
            {tarefas.map((t) => (
              <div key={t.id_tarefa} className="flex items-center justify-between border rounded-md p-3">
                <span>{t.nome}</span>
                <StatusBadge status={t.status} statusMap={TAREFA_STATUS} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ResponsavelForm open={formOpen} onOpenChange={setFormOpen} responsavel={responsavel} onSuccess={load} />
    </div>
  )
}
