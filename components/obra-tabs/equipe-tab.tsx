"use client"

import { useCallback, useEffect, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/utils/format"

interface Trabalhador {
  id_trabalhador: number
  nome: string
  especialidade: string | null
  id_contrato: number
  valor_acordado: number
}
interface Escala {
  id_escala: number
  id_trabalhador: number
  data_prevista: string
  turno: string
  status: string
}

interface EquipeTabProps {
  obraId: number
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function EquipeTab({ obraId }: EquipeTabProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([])
  const [escalas, setEscalas] = useState<Escala[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: cts } = await supabase
      .from("contrato_trabalho")
      .select("id_contrato, id_trabalhador, valor_acordado")
      .eq("id_obra", obraId)
      .eq("status", "ativo")
    const contratosList = (cts ?? []) as {
      id_contrato: number
      id_trabalhador: number
      valor_acordado: number
    }[]

    const trabIds = Array.from(
      new Set(contratosList.map((c) => c.id_trabalhador))
    )
    if (trabIds.length > 0) {
      const { data: trabs } = await supabase
        .from("trabalhador")
        .select("id_trabalhador, nome, especialidade")
        .in("id_trabalhador", trabIds)
      setTrabalhadores(
        (
          (trabs ?? []) as {
            id_trabalhador: number
            nome: string
            especialidade: string | null
          }[]
        ).map((t) => {
          const ct = contratosList.find(
            (c) => c.id_trabalhador === t.id_trabalhador
          )!
          return {
            ...t,
            id_contrato: ct.id_contrato,
            valor_acordado: ct.valor_acordado,
          }
        })
      )
    } else {
      setTrabalhadores([])
    }

    const from = format(weekStart, "yyyy-MM-dd")
    const to = format(addDays(weekStart, 5), "yyyy-MM-dd")
    const { data: esc } = await supabase
      .from("escala")
      .select("*")
      .eq("id_obra", obraId)
      .gte("data_prevista", from)
      .lte("data_prevista", to)
    setEscalas((esc ?? []) as Escala[])
    setIsLoading(false)
  }, [obraId, weekStart])

  useEffect(() => {
    load()
  }, [load])

  function getEscala(trabId: number, day: Date): Escala | undefined {
    const dateStr = format(day, "yyyy-MM-dd")
    return escalas.find(
      (e) => e.id_trabalhador === trabId && e.data_prevista === dateStr
    )
  }

  async function toggleEscala(trab: Trabalhador, day: Date) {
    const supabase = createClient()
    const dateStr = format(day, "yyyy-MM-dd")
    const existing = getEscala(trab.id_trabalhador, day)

    if (existing) {
      if (existing.status === "cancelado") {
        await supabase
          .from("escala")
          .update({ status: "planejado" })
          .eq("id_escala", existing.id_escala)
      } else {
        await supabase
          .from("escala")
          .update({ status: "cancelado" })
          .eq("id_escala", existing.id_escala)
      }
    } else {
      const { data: conflicts } = await supabase
        .from("escala")
        .select("id_obra")
        .eq("id_trabalhador", trab.id_trabalhador)
        .eq("data_prevista", dateStr)
        .eq("turno", "integral")
        .neq("status", "cancelado")
        .neq("id_obra", obraId)

      if (conflicts && conflicts.length > 0) {
        toast.error("Trabalhador já escalado em outra obra neste dia/turno")
        return
      }

      const { error } = await supabase.from("escala").insert({
        id_obra: obraId,
        id_trabalhador: trab.id_trabalhador,
        id_contrato: trab.id_contrato,
        data_prevista: dateStr,
        turno: "integral",
        status: "planejado",
      })
      if (error) {
        toast.error("Erro ao escalar: " + error.message)
        return
      }
    }
    load()
  }

  function cellStyle(escala: Escala | undefined): string {
    if (!escala) return "bg-muted/40 text-muted-foreground/60 hover:bg-muted"
    if (escala.status === "confirmado")
      return "bg-[var(--success-soft)] text-[var(--success-ink)] border-[var(--success)]/30"
    if (escala.status === "cancelado")
      return "bg-muted text-muted-foreground line-through"
    return "bg-[var(--info-soft)] text-[var(--info-ink)] border-[var(--info)]/30"
  }

  function custoDia(day: Date): number {
    const dateStr = format(day, "yyyy-MM-dd")
    return escalas
      .filter((e) => e.data_prevista === dateStr && e.status !== "cancelado")
      .reduce((sum, e) => {
        const trab = trabalhadores.find(
          (t) => t.id_trabalhador === e.id_trabalhador
        )
        return sum + (trab?.valor_acordado ?? 0)
      }, 0)
  }

  const custoSemana = days.reduce((a, d) => a + custoDia(d), 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">
              Escala semanal
            </h3>
            <p className="text-[12px] text-muted-foreground tabular-nums">
              {format(weekStart, "dd/MM", { locale: ptBR })} →{" "}
              {format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: ptBR })}
              {" · "}
              <span className="mono font-medium text-foreground">
                {formatBRL(custoSemana)}
              </span>{" "}
              custo previsto
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              aria-label="Semana anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              aria-label="Próxima semana"
            >
              <ChevronRight />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Carregando equipe…
          </CardContent>
        </Card>
      ) : trabalhadores.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Nenhum trabalhador com contrato ativo nesta obra.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="sticky left-0 z-10 min-w-[220px] bg-muted/60 px-5 py-2.5 text-left font-semibold">
                    Trabalhador
                  </th>
                  <th className="px-3 py-2.5 text-left font-semibold">Valor</th>
                  {days.map((d, i) => (
                    <th
                      key={d.toISOString()}
                      className="min-w-[90px] px-3 py-2.5 text-center font-semibold"
                    >
                      <div>{DAY_LABELS[i]}</div>
                      <div className="text-[10px] font-normal text-muted-foreground/70 tabular-nums">
                        {format(d, "dd/MM")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trabalhadores.map((t) => (
                  <tr
                    key={t.id_trabalhador}
                    className="border-b border-border hover:bg-muted/20"
                  >
                    <td className="sticky left-0 z-10 bg-card px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar variant="pf" name={t.nome} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-foreground">
                            {t.nome}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {t.especialidade ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="mono text-[12px] tabular-nums text-foreground">
                        {formatBRL(t.valor_acordado)}
                      </span>
                    </td>
                    {days.map((d) => {
                      const esc = getEscala(t.id_trabalhador, d)
                      return (
                        <td key={d.toISOString()} className="p-1.5 text-center">
                          <button
                            onClick={() => toggleEscala(t, d)}
                            className={cn(
                              "flex h-9 w-full items-center justify-center rounded border text-[11px] font-medium transition-colors",
                              cellStyle(esc)
                            )}
                            title={esc ? esc.status : "Sem escala"}
                          >
                            {esc
                              ? esc.status === "cancelado"
                                ? "✕"
                                : esc.status === "confirmado"
                                  ? "✓"
                                  : "·"
                              : ""}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                  <td className="sticky left-0 z-10 bg-muted/40 px-5 py-3 text-[13px] text-foreground">
                    Custo do dia
                  </td>
                  <td className="px-3 py-3"></td>
                  {days.map((d) => (
                    <td
                      key={d.toISOString()}
                      className="px-3 py-3 text-center"
                    >
                      <span className="mono text-[12px] font-semibold tabular-nums text-foreground">
                        {formatBRL(custoDia(d))}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3 text-[11.5px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">
              Legenda:
            </span>
            <CategoryChip tone="info">Planejado</CategoryChip>
            <CategoryChip tone="success">Confirmado</CategoryChip>
            <CategoryChip tone="neutral">Cancelado</CategoryChip>
          </div>
        </div>
      )}
    </div>
  )
}
