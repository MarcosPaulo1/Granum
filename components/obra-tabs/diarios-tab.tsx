"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DIARIO_REVISAO, DIARIO_ORIGEM } from "@/lib/constants"
import { formatDate, truncate } from "@/lib/utils/format"
import { Plus, Check, X } from "lucide-react"
import { toast } from "sonner"

interface Diario {
  id_diario: number; data: string; conteudo: string | null; origem: string
  status_revisao: string; id_responsavel: number | null
}

interface DiariosTabProps {
  obraId: number
  role: string | null
}

export function DiariosTab({ obraId, role }: DiariosTabProps) {
  const router = useRouter()
  const [diarios, setDiarios] = useState<Diario[]>([])
  const [confirmAction, setConfirmAction] = useState<{ id: number; status: string } | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("diario_obra").select("*").eq("id_obra", obraId).order("data", { ascending: false })
    setDiarios((data ?? []) as Diario[])
  }, [obraId])

  useEffect(() => { load() }, [load])

  async function updateRevisao(id: number, status: string) {
    const supabase = createClient()
    const { error } = await supabase.from("diario_obra").update({ status_revisao: status }).eq("id_diario", id)
    if (error) { toast.error("Erro ao atualizar diário: " + error.message); return }
    toast.success(`Diário ${status}`)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Diários de obra</h3>
        <Button size="sm" onClick={() => router.push(`/obras/${obraId}/diarios/novo`)}>
          <Plus className="mr-2 h-4 w-4" /> Novo diário
        </Button>
      </div>

      <div className="space-y-2">
        {diarios.map((d) => (
          <div key={d.id_diario} className="border rounded p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatDate(d.data)}</span>
                <StatusBadge status={d.origem} statusMap={DIARIO_ORIGEM} />
                <StatusBadge status={d.status_revisao} statusMap={DIARIO_REVISAO} />
              </div>
              {role === "diretor" && d.status_revisao === "pendente" && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="text-green-600" onClick={() => setConfirmAction({ id: d.id_diario, status: "aprovado" })}><Check className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setConfirmAction({ id: d.id_diario, status: "rejeitado" })}><X className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{d.conteudo ? truncate(d.conteudo, 200) : "Sem conteúdo"}</p>
          </div>
        ))}
        {diarios.length === 0 && <p className="text-muted-foreground text-sm">Nenhum diário registrado.</p>}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null) }}
        title={confirmAction?.status === "aprovado" ? "Aprovar diário?" : "Rejeitar diário?"}
        description={confirmAction?.status === "aprovado" ? "O diário será marcado como aprovado." : "O diário será marcado como rejeitado."}
        confirmLabel={confirmAction?.status === "aprovado" ? "Aprovar" : "Rejeitar"}
        variant={confirmAction?.status === "rejeitado" ? "destructive" : "default"}
        onConfirm={() => {
          if (confirmAction) updateRevisao(confirmAction.id, confirmAction.status)
          setConfirmAction(null)
        }}
      />
    </div>
  )
}
