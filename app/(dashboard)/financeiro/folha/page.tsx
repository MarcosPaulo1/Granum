"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { formatBRL, formatDate } from "@/lib/utils/format"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { startOfWeek, addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

interface FolhaRow {
  semana: string; id_trabalhador: number; trabalhador: string
  pix_chave: string | null; id_obra: number; obra: string
  dias_integral: number; dias_meia: number; faltas: number
  total_a_pagar: number
}

export default function FolhaPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [data, setData] = useState<FolhaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const weekStr = format(weekStart, "yyyy-MM-dd")
    const { data: rows } = await supabase.from("vw_resumo_pagamento_semanal").select("*").eq("semana", weekStr)
    setData((rows ?? []) as FolhaRow[])
    setIsLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  const totalGeral = data.reduce((s, r) => s + r.total_a_pagar, 0)

  // Agrupar por obra
  const byObra = data.reduce((acc, r) => {
    if (!acc[r.obra]) acc[r.obra] = []
    acc[r.obra].push(r)
    return acc
  }, {} as Record<string, FolhaRow[]>)

  function exportCSV() {
    const header = "Trabalhador,Obra,Dias Integral,Dias Meia,Faltas,Total,PIX"
    const rows = data.map(r => `${r.trabalhador},${r.obra},${r.dias_integral},${r.dias_meia},${r.faltas},${r.total_a_pagar},${r.pix_chave ?? ""}`)
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `folha_${format(weekStart, "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function gerarLancamentos() {
    if (data.length === 0) { toast.error("Nenhum dado para gerar"); return }
    const supabase = createClient()

    // Buscar plano de contas "Diárias" (2.2.1)
    const { data: plano } = await supabase.from("plano_conta").select("id_plano").eq("codigo", "2.2.1").single()
    const idPlano = (plano as { id_plano: number } | null)?.id_plano ?? null

    // Buscar centro de custo das obras
    const obraIds = [...new Set(data.map(r => r.id_obra))]
    const { data: obras } = await supabase.from("obra").select("id_obra, id_centro_custo").in("id_obra", obraIds)
    const ccMap = new Map((obras ?? []).map((o: { id_obra: number; id_centro_custo: number | null }) => [o.id_obra, o.id_centro_custo]))

    let count = 0
    for (const row of data) {
      if (row.total_a_pagar <= 0) continue
      const cc = ccMap.get(row.id_obra)
      if (!cc) continue

      const { error } = await supabase.from("lancamento").insert({
        id_obra: row.id_obra,
        id_centro_custo: cc,
        id_responsavel: 1, // será ajustado quando tiver contexto de user
        valor: row.total_a_pagar,
        tipo: "realizado",
        entrada_saida: "saida",
        data_competencia: format(weekStart, "yyyy-MM-dd"),
        historico: `Folha semanal - ${row.trabalhador}`,
        id_plano_conta: idPlano,
      })
      if (!error) count++
    }

    toast.success(`${count} lançamento(s) gerado(s)`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Folha de pagamento semanal</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">{format(weekStart, "dd/MM", { locale: ptBR })} — {format(addDays(weekStart, 6), "dd/MM/yyyy", { locale: ptBR })}</span>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
        <Button variant="outline" size="sm" onClick={gerarLancamentos}>Gerar lançamentos</Button>
      </div>

      {isLoading ? <p>Carregando...</p> : data.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum registro de presença nesta semana.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(byObra).map(([obra, rows]) => {
            const subtotal = rows.reduce((s, r) => s + r.total_a_pagar, 0)
            return (
              <div key={obra}>
                <h3 className="font-semibold mb-2">{obra} <span className="text-muted-foreground font-normal text-sm">— Subtotal: {formatBRL(subtotal)}</span></h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Trabalhador</th>
                      <th className="text-center p-2">Integral</th>
                      <th className="text-center p-2">Meia</th>
                      <th className="text-center p-2">Faltas</th>
                      <th className="text-right p-2">Total</th>
                      <th className="text-left p-2">PIX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id_trabalhador} className="border-b">
                        <td className="p-2">{r.trabalhador}</td>
                        <td className="text-center p-2">{r.dias_integral}</td>
                        <td className="text-center p-2">{r.dias_meia}</td>
                        <td className="text-center p-2">{r.faltas}</td>
                        <td className="text-right p-2 font-mono font-semibold">{formatBRL(r.total_a_pagar)}</td>
                        <td className="p-2 text-xs text-muted-foreground">{r.pix_chave ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
          <div className="text-right text-lg font-semibold">Total geral: <span className="font-mono">{formatBRL(totalGeral)}</span></div>
        </div>
      )}
    </div>
  )
}
