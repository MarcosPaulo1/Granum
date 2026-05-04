"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { ObraSelector } from "@/components/shared/obra-selector"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatBRL } from "@/lib/utils/format"

const PIE_COLORS = [
  "var(--chart-1)", // terracota
  "var(--chart-2)", // verde-oliva
  "var(--chart-3)", // indigo
  "var(--chart-4)", // amber
  "var(--chart-5)", // blue
  "var(--success)",
  "var(--info)",
  "var(--warning)",
]

interface CurvaPoint {
  mes: string
  planejado: number
  realizado: number
}

interface RDPoint {
  mes: string
  receita: number
  despesa: number
}

interface DistItem {
  nome: string
  valor: number
}

function formatMes(yyyymm: string): string {
  if (!yyyymm) return ""
  const [y, m] = yyyymm.split("-")
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ]
  return `${meses[Number(m) - 1] ?? m}/${y.slice(-2)}`
}

export default function DashboardFinanceiroPage() {
  const [obraId, setObraId] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [curvaS, setCurvaS] = useState<CurvaPoint[]>([])
  const [receitaDespesa, setReceitaDespesa] = useState<RDPoint[]>([])
  const [distribuicao, setDistribuicao] = useState<DistItem[]>([])
  const [kpis, setKpis] = useState({
    planejado: 0,
    realizado: 0,
    saldo: 0,
    entradas: 0,
  })

  const loadData = useCallback(async () => {
    if (!obraId) return
    setIsLoading(true)
    const supabase = createClient()

    const { data: curva } = await supabase
      .from("vw_curva_s_financeira")
      .select("*")
      .eq("id_obra", obraId)
      .order("data_competencia")

    type CurvaRow = {
      data_competencia: string
      tipo: string
      total_saida: number
      total_entrada: number
    }
    const curvaList = (curva ?? []) as CurvaRow[]

    // Curva acumulada
    const monthMap = new Map<string, { planejado: number; realizado: number }>()
    curvaList.forEach((r) => {
      const mes = r.data_competencia.substring(0, 7)
      const entry = monthMap.get(mes) ?? { planejado: 0, realizado: 0 }
      if (r.tipo === "planejado") entry.planejado += Number(r.total_saida)
      if (r.tipo === "realizado") entry.realizado += Number(r.total_saida)
      monthMap.set(mes, entry)
    })

    let accPlan = 0
    let accReal = 0
    const curvaData: CurvaPoint[] = Array.from(monthMap.entries())
      .sort()
      .map(([mes, v]) => {
        accPlan += v.planejado
        accReal += v.realizado
        return { mes, planejado: accPlan, realizado: accReal }
      })
    setCurvaS(curvaData)

    // Receita vs Despesa
    const rdMap = new Map<string, { receita: number; despesa: number }>()
    curvaList.forEach((r) => {
      const mes = r.data_competencia.substring(0, 7)
      const entry = rdMap.get(mes) ?? { receita: 0, despesa: 0 }
      if (r.tipo === "realizado") {
        entry.receita += Number(r.total_entrada)
        entry.despesa += Number(r.total_saida)
      }
      rdMap.set(mes, entry)
    })
    setReceitaDespesa(
      Array.from(rdMap.entries())
        .sort()
        .map(([mes, v]) => ({ mes, ...v }))
    )

    // Distribuição
    const { data: lancs } = await supabase
      .from("lancamento")
      .select("valor, id_plano_conta")
      .eq("id_obra", obraId)
      .eq("tipo", "realizado")
      .eq("entrada_saida", "saida")

    const lancsList = (lancs ?? []) as {
      valor: number
      id_plano_conta: number | null
    }[]
    const planoIds = Array.from(
      new Set(
        lancsList.filter((l) => l.id_plano_conta).map((l) => l.id_plano_conta!)
      )
    )

    if (planoIds.length > 0) {
      const { data: planos } = await supabase
        .from("plano_conta")
        .select("id_plano, nome")
        .in("id_plano", planoIds)
      const planoMap = new Map(
        (planos ?? []).map((p) => [p.id_plano, p.nome as string])
      )
      const distMap = new Map<string, number>()
      lancsList.forEach((l) => {
        const nome = l.id_plano_conta
          ? planoMap.get(l.id_plano_conta) ?? "Outros"
          : "Sem classificação"
        distMap.set(nome, (distMap.get(nome) ?? 0) + Number(l.valor))
      })
      setDistribuicao(
        Array.from(distMap.entries())
          .map(([nome, valor]) => ({ nome, valor }))
          .sort((a, b) => b.valor - a.valor)
      )
    } else {
      setDistribuicao([])
    }

    // KPIs
    const totalPlan = curvaList
      .filter((r) => r.tipo === "planejado")
      .reduce((s, r) => s + Number(r.total_saida), 0)
    const totalReal = curvaList
      .filter((r) => r.tipo === "realizado")
      .reduce((s, r) => s + Number(r.total_saida), 0)
    const totalEntradas = curvaList
      .filter((r) => r.tipo === "realizado")
      .reduce((s, r) => s + Number(r.total_entrada), 0)
    setKpis({
      planejado: totalPlan,
      realizado: totalReal,
      saldo: totalEntradas - totalReal,
      entradas: totalEntradas,
    })
    setIsLoading(false)
  }, [obraId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const variacao =
    kpis.planejado > 0
      ? ((kpis.realizado - kpis.planejado) / kpis.planejado) * 100
      : 0

  // Tones: variação positiva (gastou mais que planejado) = warning/danger
  const variacaoTone =
    Math.abs(variacao) < 5
      ? "neutral"
      : variacao > 15
        ? "danger"
        : variacao > 0
          ? "warning"
          : "success"

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relatórios · Performance financeira"
        title="Dashboard financeiro"
        subtitle="Curva S, receita × despesa e distribuição de gastos por obra"
        actions={
          <ObraSelector
            value={obraId || undefined}
            onValueChange={setObraId}
            className="w-64"
          />
        }
      />

      {!obraId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <PieIcon className="size-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Selecione uma obra para ver os indicadores financeiros.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Carregando dados…
          </CardContent>
        </Card>
      ) : (
        <>
          <KpiGrid cols={4}>
            <KpiCard
              label="Planejado"
              value={formatBRL(kpis.planejado)}
              sub="Custo total previsto"
              icon={<Activity />}
            />
            <KpiCard
              tone="info"
              label="Realizado"
              value={formatBRL(kpis.realizado)}
              sub={`${kpis.planejado > 0 ? Math.round((kpis.realizado * 100) / kpis.planejado) : 0}% do planejado`}
              icon={<ArrowUp />}
            />
            <KpiCard
              tone={variacaoTone}
              label="Variação"
              value={`${variacao >= 0 ? "+" : ""}${variacao.toFixed(1)}%`}
              sub={
                variacao > 0
                  ? `${formatBRL(kpis.realizado - kpis.planejado)} acima`
                  : variacao < 0
                    ? `${formatBRL(Math.abs(kpis.realizado - kpis.planejado))} abaixo`
                    : "No previsto"
              }
              trend={variacao > 0 ? "down" : "up"}
              icon={
                variacao > 0 ? <TrendingUp /> : <TrendingDown />
              }
            />
            <KpiCard
              tone={kpis.saldo >= 0 ? "success" : "danger"}
              label="Saldo de caixa"
              value={formatBRL(kpis.saldo)}
              sub={`${formatBRL(kpis.entradas)} em entradas`}
              icon={<ArrowDown />}
            />
          </KpiGrid>

          {curvaS.length > 0 ? (
            <Card>
              <CardContent className="pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground">
                      Curva S — Planejado × Realizado
                    </h3>
                    <p className="text-[12px] text-muted-foreground">
                      Acumulado mensal de saídas
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={curvaS}
                    margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="mes"
                      tickFormatter={formatMes}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        `R$${(v / 1000).toFixed(0)}k`
                      }
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      stroke="var(--border)"
                    />
                    <Tooltip
                      formatter={(v) => formatBRL(Number(v))}
                      labelFormatter={(l) => formatMes(String(l))}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="planejado"
                      stroke="var(--chart-3)"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Planejado"
                    />
                    <Line
                      type="monotone"
                      dataKey="realizado"
                      stroke="var(--chart-2)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      name="Realizado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            {receitaDespesa.length > 0 ? (
              <Card className="lg:col-span-2">
                <CardContent className="pt-5">
                  <div className="mb-4">
                    <h3 className="text-[15px] font-semibold text-foreground">
                      Receita × Despesa
                    </h3>
                    <p className="text-[12px] text-muted-foreground">
                      Movimentação realizada por mês
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={receitaDespesa}
                      margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="mes"
                        tickFormatter={formatMes}
                        tick={{
                          fontSize: 11,
                          fill: "var(--muted-foreground)",
                        }}
                        stroke="var(--border)"
                      />
                      <YAxis
                        tickFormatter={(v) =>
                          `R$${(v / 1000).toFixed(0)}k`
                        }
                        tick={{
                          fontSize: 11,
                          fill: "var(--muted-foreground)",
                        }}
                        stroke="var(--border)"
                      />
                      <Tooltip
                        formatter={(v) => formatBRL(Number(v))}
                        labelFormatter={(l) => formatMes(String(l))}
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      />
                      <Bar
                        dataKey="receita"
                        fill="var(--chart-2)"
                        name="Receita"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="despesa"
                        fill="var(--chart-1)"
                        name="Despesa"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : null}

            {distribuicao.length > 0 ? (
              <Card>
                <CardContent className="pt-5">
                  <div className="mb-4">
                    <h3 className="text-[15px] font-semibold text-foreground">
                      Top categorias de gasto
                    </h3>
                    <p className="text-[12px] text-muted-foreground">
                      Distribuição dos lançamentos realizados
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={distribuicao.slice(0, 8)}
                        dataKey="valor"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {distribuicao.slice(0, 8).map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => formatBRL(Number(v))}
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1.5">
                    {distribuicao.slice(0, 5).map((d, i) => {
                      const total = distribuicao.reduce(
                        (a, x) => a + x.valor,
                        0
                      )
                      const pct = total > 0 ? (d.valor * 100) / total : 0
                      return (
                        <div
                          key={d.nome}
                          className="flex items-center justify-between text-[12px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                            <span className="truncate text-foreground">
                              {d.nome}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="mono tabular-nums text-foreground">
                              {formatBRL(d.valor)}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
