"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { DIARIO_ORIGEM, DIARIO_REVISAO } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatDate, truncate } from "@/lib/utils/format"

interface Diario {
  id_diario: number
  data: string
  conteudo: string | null
  origem: string
  status_revisao: string
  id_responsavel: number | null
}

const REVISAO_META: Record<string, { cls: string; label: string }> = {
  aprovado: { cls: "badge-success", label: "Aprovado" },
  pendente: { cls: "badge-warning", label: "Pendente" },
  rejeitado: { cls: "badge-danger", label: "Rejeitado" },
}

const ORIGEM_META: Record<string, { cls: string; label: string }> = {
  manual: { cls: "badge-neutral", label: "Manual" },
  whatsapp: {
    cls: "",
    label: "WhatsApp",
  },
  plaud: { cls: "", label: "Plaud" },
  ia: { cls: "", label: "IA" },
}

export function DiariosTab({
  obraId,
  role,
}: {
  obraId: number
  role: string | null
}) {
  const router = useRouter()
  const [diarios, setDiarios] = useState<Diario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<{
    id: number
    status: string
  } | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("diario_obra")
      .select("*")
      .eq("id_obra", obraId)
      .order("data", { ascending: false })
    setDiarios((data ?? []) as Diario[])
    setIsLoading(false)
  }, [obraId])

  useEffect(() => {
    load()
  }, [load])

  async function updateRevisao(id: number, status: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("diario_obra")
      .update({ status_revisao: status })
      .eq("id_diario", id)
    if (error) {
      toast.error("Erro: " + error.message)
      return
    }
    toast.success(`Diário ${status}`)
    load()
  }

  const pendentes = diarios.filter(
    (d) => d.status_revisao === "pendente"
  ).length

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h3>
            <Icon name="book" />
            Diários de obra · {diarios.length}
          </h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {pendentes > 0 ? (
              <span
                className="badge badge-warning"
                style={{ fontSize: 11 }}
              >
                {pendentes} pendente{pendentes !== 1 ? "s" : ""} de revisão
              </span>
            ) : null}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() =>
                router.push(`/obras/${obraId}/diarios/novo`)
              }
            >
              <Icon name="plus" />
              Novo diário
            </button>
          </div>
        </div>

        {isLoading ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: "var(--ink-muted)",
              fontSize: 13.5,
            }}
          >
            Carregando…
          </div>
        ) : diarios.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: "var(--ink-muted)",
              fontSize: 13.5,
            }}
          >
            Nenhum diário registrado.
          </div>
        ) : (
          <div style={{ padding: 12 }}>
            {diarios.map((d) => {
              const rm = REVISAO_META[d.status_revisao] ?? REVISAO_META.pendente
              const om = ORIGEM_META[d.origem] ?? ORIGEM_META.manual
              const isReject = d.status_revisao === "rejeitado"
              return (
                <div
                  key={d.id_diario}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    marginBottom: 8,
                    background: isReject ? "var(--danger-soft)" : "var(--white)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {formatDate(d.data)}
                      </span>
                      <span className={"badge " + om.cls}>{om.label}</span>
                      <span className={"badge dot " + rm.cls}>{rm.label}</span>
                    </div>
                    {role === "diretor" &&
                    d.status_revisao === "pendente" ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            setConfirmAction({
                              id: d.id_diario,
                              status: "aprovado",
                            })
                          }
                        >
                          <Icon name="check" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--danger-ink)" }}
                          onClick={() =>
                            setConfirmAction({
                              id: d.id_diario,
                              status: "rejeitado",
                            })
                          }
                        >
                          <Icon name="x" />
                          Rejeitar
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 12.5,
                      color: "var(--ink-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {d.conteudo ? truncate(d.conteudo, 280) : "Sem conteúdo"}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null)
        }}
        title={
          confirmAction?.status === "aprovado"
            ? "Aprovar diário?"
            : "Rejeitar diário?"
        }
        description={
          confirmAction?.status === "aprovado"
            ? "O diário será marcado como aprovado."
            : "O diário será marcado como rejeitado."
        }
        confirmLabel={
          confirmAction?.status === "aprovado" ? "Aprovar" : "Rejeitar"
        }
        variant={
          confirmAction?.status === "rejeitado" ? "destructive" : "default"
        }
        onConfirm={() => {
          if (confirmAction)
            updateRevisao(confirmAction.id, confirmAction.status)
          setConfirmAction(null)
        }}
      />
    </>
  )
}
