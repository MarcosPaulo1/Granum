"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { ObraSelector } from "@/components/shared/obra-selector"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatBRL } from "@/lib/utils/format"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { startOfWeek, addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AlocRow {
  id_obra: number; obra: string; data_prevista: string
  id_trabalhador: number; trabalhador: string; especialidade: string | null
  turno: string; status_escala: string; tipo_presenca: string | null
  situacao: string
}

const SITUACAO_COLOR: Record<string, string> = {
  presente: "bg-green-500 text-white",
  ausente: "bg-red-500 text-white",
  futuro: "bg-blue-400 text-white",
}

export default function AlocacaoPage() {
  const [obraId, setObraId] = useState<number>(0)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [data, setData] = useState<AlocRow[]>([])

  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  const load = useCallback(async () => {
    if (!obraId) return
    const supabase = createClient()
    const from = format(weekStart, "yyyy-MM-dd")
    const to = format(addDays(weekStart, 5), "yyyy-MM-dd")
    const { data: rows } = await supabase.from("vw_alocacao_diaria").select("*").eq("id_obra", obraId).gte("data_prevista", from).lte("data_prevista", to)
    setData((rows ?? []) as AlocRow[])
  }, [obraId, weekStart])

  useEffect(() => { load() }, [load])

  const trabalhadores = [...new Map(data.map(r => [r.id_trabalhador, { id: r.id_trabalhador, nome: r.trabalhador, especialidade: r.especialidade }])).values()]

  function getSituacao(trabId: number, day: Date): string {
    const dateStr = format(day, "yyyy-MM-dd")
    const row = data.find(r => r.id_trabalhador === trabId && r.data_prevista === dateStr)
    return row?.situacao ?? ""
  }

  const totalPorDia = days.map(d => {
    const dateStr = format(d, "yyyy-MM-dd")
    return data.filter(r => r.data_prevista === dateStr && r.situacao !== "").length
  })

  const taxaPresenca = data.length > 0
    ? (data.filter(r => r.situacao === "presente").length / data.filter(r => r.situacao !== "futuro").length * 100) || 0
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold">Painel de alocação</h1>
        <div className="flex items-center gap-4">
          <ObraSelector value={obraId || undefined} onValueChange={setObraId} className="w-64" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm">{format(weekStart, "dd/MM", { locale: ptBR })} — {format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: ptBR })}</span>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {!obraId ? <p className="text-muted-foreground">Selecione uma obra.</p> : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Trabalhadores</p><p className="text-xl font-semibold">{trabalhadores.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Alocações na semana</p><p className="text-xl font-semibold">{data.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Taxa de presença</p><p className="text-xl font-semibold">{taxaPresenca.toFixed(0)}%</p></CardContent></Card>
          </div>

          {trabalhadores.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma alocação nesta semana.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 text-left">Trabalhador</th>
                    {days.map(d => <th key={d.toISOString()} className="border p-2 text-center min-w-[80px]">{format(d, "EEE dd/MM", { locale: ptBR })}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {trabalhadores.map(t => (
                    <tr key={t.id}>
                      <td className="border p-2">
                        <div>{t.nome}</div>
                        <div className="text-xs text-muted-foreground">{t.especialidade}</div>
                      </td>
                      {days.map(d => {
                        const sit = getSituacao(t.id, d)
                        return (
                          <td key={d.toISOString()} className={`border p-2 text-center text-xs ${sit ? SITUACAO_COLOR[sit] ?? "bg-gray-200" : "bg-gray-100"}`}>
                            {sit || "—"}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="border p-2">Total/dia</td>
                    {totalPorDia.map((t, i) => <td key={i} className="border p-2 text-center">{t}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
