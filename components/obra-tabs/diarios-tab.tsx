"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, FileText, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { CategoryChip } from "@/components/shared/category-chip"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DIARIO_ORIGEM, DIARIO_REVISAO } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatDate, truncate } from "@/lib/utils/format"

interface Diario {
  id_diario: number
  data: string
  conteudo: string | null
  origem: string
  status_revisao: string
  id_responsavel: number | null
}

interface DiariosTabProps {
  obraId: number
  role: string | null
}

const REVISAO_TONE: Record<
  string,
  "success" | "warning" | "danger" | "neutral"
> = {
  aprovado: "success",
  pendente: "warning",
  rejeitado: "danger",
}

const ORIGEM_TONE: Record<string, "primary" | "info" | "neutral"> = {
  manual: "neutral",
  ia: "primary",
  whatsapp: "info",
}

export function DiariosTab({ obraId, role }: DiariosTabProps) {
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
      toast.error("Erro ao atualizar diário: " + error.message)
      return
    }
    toast.success(`Diário ${status}`)
    load()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">
              Diários de obra
            </h3>
            <p className="text-[12px] text-muted-foreground">
              {diarios.length} diário{diarios.length === 1 ? "" : "s"} ·{" "}
              {diarios.filter((d) => d.status_revisao === "pendente").length}{" "}
              pendente
              {diarios.filter((d) => d.status_revisao === "pendente")
                .length === 1
                ? ""
                : "s"}{" "}
              de revisão
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push(`/obras/${obraId}/diarios/novo`)}
          >
            <Plus data-icon="inline-start" />
            Novo diário
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Carregando diários…
          </CardContent>
        </Card>
      ) : diarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="size-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Nenhum diário registrado ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {diarios.map((d) => {
            const revisaoMeta = DIARIO_REVISAO[
              d.status_revisao as keyof typeof DIARIO_REVISAO
            ] as { label: string } | undefined
            const origemMeta = DIARIO_ORIGEM[
              d.origem as keyof typeof DIARIO_ORIGEM
            ] as { label: string } | undefined
            return (
              <Card
                key={d.id_diario}
                className={cn(
                  d.status_revisao === "rejeitado" &&
                    "border-destructive/30 bg-[var(--danger-soft)]/20"
                )}
              >
                <CardContent className="space-y-2 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono text-[13.5px] font-semibold tabular-nums text-foreground">
                        {formatDate(d.data)}
                      </span>
                      <CategoryChip tone={ORIGEM_TONE[d.origem] ?? "neutral"}>
                        {origemMeta?.label ?? d.origem}
                      </CategoryChip>
                      <CategoryChip
                        tone={REVISAO_TONE[d.status_revisao] ?? "neutral"}
                      >
                        {revisaoMeta?.label ?? d.status_revisao}
                      </CategoryChip>
                    </div>
                    {role === "diretor" && d.status_revisao === "pendente" ? (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-[var(--success-ink)]"
                          onClick={() =>
                            setConfirmAction({
                              id: d.id_diario,
                              status: "aprovado",
                            })
                          }
                          aria-label="Aprovar"
                        >
                          <Check />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={() =>
                            setConfirmAction({
                              id: d.id_diario,
                              status: "rejeitado",
                            })
                          }
                          aria-label="Rejeitar"
                        >
                          <X />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {d.conteudo ? truncate(d.conteudo, 240) : "Sem conteúdo"}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
    </div>
  )
}
