"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ObraSelector } from "@/components/shared/obra-selector"
import { Card, CardContent } from "@/components/ui/card"
import { formatBRL } from "@/lib/utils/format"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, type PieLabelRenderProps } from "recharts"

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export default function DashboardFinanceiroPage() {
  const [obraId, setObraId] = useState<number>(0)
  const [curvaS, setCurvaS] = useState<{ mes: string; planejado: number; realizado: number }[]>([])
  const [receitaDespesa, setReceitaDespesa] = useState<{ mes: string; receita: number; despesa: number }[]>([])
  const [distribuicao, setDistribuicao] = useState<{ nome: string; valor: number }[]>([])
  const [kpis, setKpis] = useState({ planejado: 0, realizado: 0, saldo: 0 })

  useEffect(() => {
    if (!obraId) return
    loadData()
  }, [obraId])

  async function loadData() {
    const supabase = createClient()

    // Curva S
    const { data: curva } = await supabase.from("vw_curva_s_financeira").select("*").eq("id_obra", obraId).order("data_competencia")
    const curvaList = (curva ?? []) as { data_competencia: string; tipo: string; total_saida: number; total_entrada: number }[]

    // Agrupar por mês e calcular acumulado
    const monthMap = new Map<string, { planejado: number; realizado: number }>()
    curvaList.forEach(r => {
      const mes = r.data_competencia.substring(0, 7) // yyyy-MM
      const entry = monthMap.get(mes) ?? { planejado: 0, realizado: 0 }
      if (r.tipo === "planejado") entry.planejado += r.total_saida
      if (r.tipo === "realizado") entry.realizado += r.total_saida
      monthMap.set(mes, entry)
    })

    let accPlan = 0, accReal = 0
    const curvaData = Array.from(monthMap.entries()).sort().map(([mes, v]) => {
      accPlan += v.planejado
      accReal += v.realizado
      return { mes, planejado: accPlan, realizado: accReal }
    })
    setCurvaS(curvaData)

    // Receita x Despesa por mês
    const rdMap = new Map<string, { receita: number; despesa: number }>()
    curvaList.forEach(r => {
      const mes = r.data_competencia.substring(0, 7)
      const entry = rdMap.get(mes) ?? { receita: 0, despesa: 0 }
      if (r.tipo === "realizado") {
        entry.receita += r.total_entrada
        entry.despesa += r.total_saida
      }
      rdMap.set(mes, entry)
    })
    setReceitaDespesa(Array.from(rdMap.entries()).sort().map(([mes, v]) => ({ mes, ...v })))

    // Distribuição por plano de contas
    const { data: lancs } = await supabase.from("lancamento").select("valor, id_plano_conta").eq("id_obra", obraId).eq("tipo", "realizado").eq("entrada_saida", "saida")
    const lancsList = (lancs ?? []) as { valor: number; id_plano_conta: number | null }[]
    const planoIds = [...new Set(lancsList.filter(l => l.id_plano_conta).map(l => l.id_plano_conta!))]

    if (planoIds.length > 0) {
      const { data: planos } = await supabase.from("plano_conta").select("id_plano, nome").in("id_plano", planoIds)
      const planoMap = new Map((planos ?? []).map((p: { id_plano: number; nome: string }) => [p.id_plano, p.nome]))

      const distMap = new Map<string, number>()
      lancsList.forEach(l => {
        const nome = l.id_plano_conta ? planoMap.get(l.id_plano_conta) ?? "Outros" : "Sem classificação"
        distMap.set(nome, (distMap.get(nome) ?? 0) + l.valor)
      })
      setDistribuicao(Array.from(distMap.entries()).map(([nome, valor]) => ({ nome, valor })))
    } else {
      setDistribuicao([])
    }

    // KPIs
    const totalPlan = curvaList.filter(r => r.tipo === "planejado").reduce((s, r) => s + r.total_saida, 0)
    const totalReal = curvaList.filter(r => r.tipo === "realizado").reduce((s, r) => s + r.total_saida, 0)
    const totalEntradas = curvaList.filter(r => r.tipo === "realizado").reduce((s, r) => s + r.total_entrada, 0)
    setKpis({ planejado: totalPlan, realizado: totalReal, saldo: totalEntradas - totalReal })
  }

  const variacao = kpis.planejado > 0 ? ((kpis.realizado - kpis.planejado) / kpis.planejado * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard financeiro</h1>
        <ObraSelector value={obraId || undefined} onValueChange={setObraId} className="w-64" />
      </div>

      {!obraId ? <p className="text-muted-foreground">Selecione uma obra para ver o dashboard.</p> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Planejado</p><p className="text-xl font-mono font-semibold">{formatBRL(kpis.planejado)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Realizado</p><p className="text-xl font-mono font-semibold">{formatBRL(kpis.realizado)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Variação</p><p className={`text-xl font-mono font-semibold ${variacao > 0 ? "text-red-600" : "text-green-600"}`}>{variacao.toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Saldo</p><p className={`text-xl font-mono font-semibold ${kpis.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>{formatBRL(kpis.saldo)}</p></CardContent></Card>
          </div>

          {curvaS.length > 0 && (
            <Card><CardContent className="pt-4">
              <h3 className="font-semibold mb-4">Curva S — Planejado vs Realizado (acumulado)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={curvaS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatBRL(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="planejado" stroke="#3b82f6" strokeDasharray="5 5" name="Planejado" />
                  <Line type="monotone" dataKey="realizado" stroke="#22c55e" name="Realizado" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}

          {receitaDespesa.length > 0 && (
            <Card><CardContent className="pt-4">
              <h3 className="font-semibold mb-4">Receita vs Despesa por mês</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={receitaDespesa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatBRL(Number(v))} />
                  <Legend />
                  <Bar dataKey="receita" fill="#22c55e" name="Receita" />
                  <Bar dataKey="despesa" fill="#ef4444" name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}

          {distribuicao.length > 0 && (
            <Card><CardContent className="pt-4">
              <h3 className="font-semibold mb-4">Distribuição de gastos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={distribuicao} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }: PieLabelRenderProps) => `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
                    {distribuicao.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatBRL(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  )
}
