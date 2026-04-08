"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { formatBRL } from "@/lib/utils/format"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { addDays, startOfWeek, format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Trabalhador { id_trabalhador: number; nome: string; especialidade: string | null; id_contrato: number; valor_acordado: number }
interface Escala { id_escala: number; id_trabalhador: number; data_prevista: string; turno: string; status: string }

interface EquipeTabProps {
  obraId: number
}

export function EquipeTab({ obraId }: EquipeTabProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([])
  const [escalas, setEscalas] = useState<Escala[]>([])

  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  const load = useCallback(async () => {
    const supabase = createClient()

    const { data: cts } = await supabase.from("contrato_trabalho").select("id_contrato, id_trabalhador, valor_acordado").eq("id_obra", obraId).eq("status", "ativo")
    const contratosList = (cts ?? []) as { id_contrato: number; id_trabalhador: number; valor_acordado: number }[]

    const trabIds = [...new Set(contratosList.map(c => c.id_trabalhador))]
    if (trabIds.length > 0) {
      const { data: trabs } = await supabase.from("trabalhador").select("id_trabalhador, nome, especialidade").in("id_trabalhador", trabIds)
      setTrabalhadores(((trabs ?? []) as { id_trabalhador: number; nome: string; especialidade: string | null }[]).map(t => {
        const ct = contratosList.find(c => c.id_trabalhador === t.id_trabalhador)!
        return { ...t, id_contrato: ct.id_contrato, valor_acordado: ct.valor_acordado }
      }))
    } else {
      setTrabalhadores([])
    }

    const from = format(weekStart, "yyyy-MM-dd")
    const to = format(addDays(weekStart, 5), "yyyy-MM-dd")
    const { data: esc } = await supabase.from("escala").select("*").eq("id_obra", obraId).gte("data_prevista", from).lte("data_prevista", to)
    setEscalas((esc ?? []) as Escala[])
  }, [obraId, weekStart])

  useEffect(() => { load() }, [load])

  function getEscala(trabId: number, day: Date): Escala | undefined {
    const dateStr = format(day, "yyyy-MM-dd")
    return escalas.find(e => e.id_trabalhador === trabId && e.data_prevista === dateStr)
  }

  async function toggleEscala(trab: Trabalhador, day: Date) {
    const supabase = createClient()
    const dateStr = format(day, "yyyy-MM-dd")
    const existing = getEscala(trab.id_trabalhador, day)

    if (existing) {
      if (existing.status === "cancelado") {
        await supabase.from("escala").update({ status: "planejado" }).eq("id_escala", existing.id_escala)
      } else {
        await supabase.from("escala").update({ status: "cancelado" }).eq("id_escala", existing.id_escala)
      }
    } else {
      const { error } = await supabase.from("escala").insert({
        id_obra: obraId,
        id_trabalhador: trab.id_trabalhador,
        id_contrato: trab.id_contrato,
        data_prevista: dateStr,
        turno: "integral",
        status: "planejado",
      })
      if (error) { toast.error("Erro: " + error.message); return }
    }
    load()
  }

  function cellColor(escala: Escala | undefined): string {
    if (!escala) return "bg-gray-100"
    if (escala.status === "confirmado") return "bg-blue-700 text-white"
    if (escala.status === "cancelado") return "bg-gray-300 line-through"
    return "bg-blue-400 text-white"
  }

  function custoDia(day: Date): number {
    const dateStr = format(day, "yyyy-MM-dd")
    return escalas
      .filter(e => e.data_prevista === dateStr && e.status !== "cancelado")
      .reduce((sum, e) => {
        const trab = trabalhadores.find(t => t.id_trabalhador === e.id_trabalhador)
        return sum + (trab?.valor_acordado ?? 0)
      }, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Escala semanal</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">{format(weekStart, "dd/MM", { locale: ptBR })} — {format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: ptBR })}</span>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {trabalhadores.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum trabalhador com contrato ativo nesta obra.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-2 text-left">Trabalhador</th>
                <th className="border p-2 text-left">Valor</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="border p-2 text-center min-w-[80px]">
                    {format(d, "EEE dd/MM", { locale: ptBR })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trabalhadores.map((t) => (
                <tr key={t.id_trabalhador}>
                  <td className="border p-2">
                    <div>{t.nome}</div>
                    <div className="text-xs text-muted-foreground">{t.especialidade}</div>
                  </td>
                  <td className="border p-2 font-mono text-xs">{formatBRL(t.valor_acordado)}</td>
                  {days.map((d) => {
                    const esc = getEscala(t.id_trabalhador, d)
                    return (
                      <td
                        key={d.toISOString()}
                        className={`border p-2 text-center cursor-pointer text-xs ${cellColor(esc)}`}
                        onClick={() => toggleEscala(t, d)}
                      >
                        {esc ? (esc.status === "cancelado" ? "✕" : "✓") : ""}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="border p-2">Custo do dia</td>
                <td className="border p-2"></td>
                {days.map((d) => (
                  <td key={d.toISOString()} className="border p-2 text-center font-mono text-xs">{formatBRL(custoDia(d))}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
