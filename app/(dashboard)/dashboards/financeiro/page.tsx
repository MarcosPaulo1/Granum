"use client"

// Port literal de granum-design/dashboard-financeiro-app.jsx +
// df-sec-visao-geral + df-sec-analise + df-sec-saude + df-sec-curva-s
// Versao com 4 secoes ancoradas, dados reais da Supabase

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { addMonths, format, parseISO, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface MesData {
  m: string
  entPlan: number
  entReal: number | null
  saiPlan: number
  saiReal: number | null
}

interface SaldoData {
  m: string
  real: number | null
  prev: number
}

interface PCData {
  nome: string
  v: number
  cor: string
}

interface ObraSaude {
  id_obra: number
  id: string
  nome: string
  status: string
  cliente: string
  pct: number
  orcamento: number
  realizado: number
  variacao: number
}

const SECTIONS = [
  { id: "visao-geral", num: "01", label: "Visão geral" },
  { id: "analise-financeira", num: "02", label: "Análise financeira" },
  { id: "saude-obras", num: "03", label: "Saúde das obras" },
  { id: "curva-s", num: "04", label: "Curva S" },
]

const PERIODOS = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "ytd", label: "YTD" },
  { value: "12m", label: "12 meses" },
] as const

const DONUT_COLORS = [
  "var(--primary)",
  "var(--info)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "#7C3AED",
  "#EA580C",
  "var(--ink-soft)",
]

function fmtBRL(v: number): string {
  if (!v) return "R$ 0"
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000) return "R$ " + Math.round(v / 1000) + " mil"
  return "R$ " + v
}

function pct(v: number): string {
  return v.toFixed(1).replace(".", ",") + "%"
}

// ── Bar chart Entradas × Saídas ──
function BarsEntSaida({
  data,
  mesAtualIdx,
}: {
  data: MesData[]
  mesAtualIdx: number
}) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-muted)",
        }}
      >
        Sem dados
      </div>
    )
  }
  const w = 740,
    h = 240,
    pad = { l: 50, r: 14, t: 16, b: 28 }
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b
  const max =
    Math.max(
      ...data.flatMap((d) => [
        d.entPlan / 1000,
        (d.entReal ?? 0) / 1000,
        d.saiPlan / 1000,
        (d.saiReal ?? 0) / 1000,
      ])
    ) * 1.1 || 1
  const groupW = iw / data.length
  const barW = (groupW * 0.8) / 4
  const yS = (v: number) => pad.t + ih - (v / max) * ih
  const grids = [0, max / 4, max / 2, (3 * max) / 4, max].map(Math.round)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 240 }}>
      <defs>
        <pattern
          id="patternEntPlan"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="var(--success)"
            strokeWidth="2"
            opacity="0.4"
          />
        </pattern>
        <pattern
          id="patternSaiPlan"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="#D97706"
            strokeWidth="2"
            opacity="0.4"
          />
        </pattern>
      </defs>
      {grids.map((g, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            x2={w - pad.r}
            y1={yS(g)}
            y2={yS(g)}
            stroke="var(--line)"
            strokeDasharray="2,3"
          />
          <text
            x={pad.l - 8}
            y={yS(g) + 3}
            textAnchor="end"
            style={{
              fontSize: 10.5,
              fill: "var(--ink-muted)",
              fontFamily: "monospace",
            }}
          >
            {g}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + i * groupW + groupW * 0.1
        const showReal = d.entReal != null
        const isFuture = i > mesAtualIdx
        return (
          <g key={i}>
            <rect
              x={cx + 0}
              y={yS(d.entPlan / 1000)}
              width={barW}
              height={pad.t + ih - yS(d.entPlan / 1000)}
              fill="url(#patternEntPlan)"
              stroke="var(--success)"
              strokeWidth="0.8"
              opacity={isFuture ? 0.7 : 1}
            />
            {showReal && (
              <rect
                x={cx + barW + 1}
                y={yS((d.entReal ?? 0) / 1000)}
                width={barW}
                height={pad.t + ih - yS((d.entReal ?? 0) / 1000)}
                fill="var(--success)"
              />
            )}
            <rect
              x={cx + 2 * barW + 4}
              y={yS(d.saiPlan / 1000)}
              width={barW}
              height={pad.t + ih - yS(d.saiPlan / 1000)}
              fill="url(#patternSaiPlan)"
              stroke="#D97706"
              strokeWidth="0.8"
              opacity={isFuture ? 0.7 : 1}
            />
            {showReal && (
              <rect
                x={cx + 3 * barW + 5}
                y={yS((d.saiReal ?? 0) / 1000)}
                width={barW}
                height={pad.t + ih - yS((d.saiReal ?? 0) / 1000)}
                fill="#D97706"
              />
            )}
            <text
              x={cx + 2 * barW + 2.5}
              y={h - 8}
              textAnchor="middle"
              style={{
                fontSize: 10.5,
                fill: i === mesAtualIdx ? "var(--ink)" : "var(--ink-muted)",
                fontFamily: "monospace",
                fontWeight: i === mesAtualIdx ? 600 : 400,
              }}
            >
              {d.m}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Donut ──
function Donut({
  data,
  totalLabel = "Total",
}: {
  data: PCData[]
  totalLabel?: string
}) {
  const tot = data.reduce((a, d) => a + d.v, 0)
  if (tot === 0)
    return (
      <div
        style={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-muted)",
          fontSize: 12,
        }}
      >
        Sem saídas no período
      </div>
    )
  const size = 180,
    r = 75,
    inner = 50,
    cx = size / 2,
    cy = size / 2
  let acc = 0
  return (
    <div className="df-donut-wrap">
      <svg width={size} height={size}>
        {data.map((d, i) => {
          const p = d.v / tot
          const start = acc,
            end = acc + p
          acc = end
          const a0 = start * Math.PI * 2 - Math.PI / 2
          const a1 = end * Math.PI * 2 - Math.PI / 2
          const x0 = cx + r * Math.cos(a0),
            y0 = cy + r * Math.sin(a0)
          const x1 = cx + r * Math.cos(a1),
            y1 = cy + r * Math.sin(a1)
          const x2 = cx + inner * Math.cos(a1),
            y2 = cy + inner * Math.sin(a1)
          const x3 = cx + inner * Math.cos(a0),
            y3 = cy + inner * Math.sin(a0)
          const large = p > 0.5 ? 1 : 0
          return (
            <path
              key={i}
              d={`M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${inner},${inner} 0 ${large} 0 ${x3},${y3} Z`}
              fill={d.cor}
            />
          )
        })}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          style={{
            fontSize: 10,
            fill: "var(--ink-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {totalLabel}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          style={{
            fontFamily: "serif",
            fontSize: 22,
            fill: "var(--ink)",
          }}
        >
          {fmtBRL(tot)}
        </text>
      </svg>
      <div className="df-donut-legend">
        {data.map((d, i) => (
          <div key={i} className="item">
            <span className="swatch" style={{ background: d.cor }}></span>
            <span className="nm">{d.nome}</span>
            <span className="v">{((d.v / tot) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Linha Curva S ──
function LinhaSaldo({
  data,
  mesAtualIdx,
}: {
  data: SaldoData[]
  mesAtualIdx: number
}) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-muted)",
        }}
      >
        Sem dados
      </div>
    )
  }
  const w = 740,
    h = 240,
    pad = { l: 60, r: 14, t: 16, b: 28 }
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b
  const todos = data.flatMap((d) =>
    [d.real, d.prev].filter((v) => v != null)
  ) as number[]
  const max = Math.max(...todos) * 1.05 || 1
  const min = Math.min(0, Math.min(...todos))
  const range = max - min || 1
  const xS = (i: number) =>
    pad.l + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2)
  const yS = (v: number) => pad.t + ih - ((v - min) / range) * ih
  const realPts = data.filter((d) => d.real != null)
  const realPath = realPts
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xS(data.indexOf(d))} ${yS(d.real!)}`)
    .join(" ")
  const prevPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xS(i)} ${yS(d.prev)}`)
    .join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 240 }}>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const v = min + range * p
        return (
          <g key={i}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={yS(v)}
              y2={yS(v)}
              stroke="var(--line)"
              strokeDasharray="2,3"
            />
            <text
              x={pad.l - 8}
              y={yS(v) + 3}
              textAnchor="end"
              style={{
                fontSize: 10.5,
                fill: "var(--ink-muted)",
                fontFamily: "monospace",
              }}
            >
              {Math.round(v / 1000)}k
            </text>
          </g>
        )
      })}
      <path
        d={prevPath}
        stroke="var(--info)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="4,3"
      />
      <path d={realPath} stroke="var(--primary)" strokeWidth="2" fill="none" />
      {data.map((d, i) => (
        <text
          key={i}
          x={xS(i)}
          y={h - 8}
          textAnchor="middle"
          style={{
            fontSize: 10.5,
            fill: i === mesAtualIdx ? "var(--ink)" : "var(--ink-muted)",
            fontFamily: "monospace",
            fontWeight: i === mesAtualIdx ? 600 : 400,
          }}
        >
          {d.m}
        </text>
      ))}
      {realPts.map((d, i) => (
        <circle
          key={i}
          cx={xS(data.indexOf(d))}
          cy={yS(d.real!)}
          r="3"
          fill="var(--primary)"
        />
      ))}
    </svg>
  )
}

export default function DashboardFinanceiroPage() {
  const [periodo, setPeriodo] =
    useState<(typeof PERIODOS)[number]["value"]>("ytd")
  const [activeSection, setActiveSection] = useState("visao-geral")
  const [meses, setMeses] = useState<MesData[]>([])
  const [saldoMes, setSaldoMes] = useState<SaldoData[]>([])
  const [pcData, setPcData] = useState<PCData[]>([])
  const [obras, setObras] = useState<ObraSaude[]>([])
  const [kpis, setKpis] = useState({
    receita: 0,
    despesa: 0,
    saldo: 0,
    margem: 0,
  })

  const mesAtualIdx = useMemo(() => {
    const todayKey = format(new Date(), "yyyy-MM")
    return meses.findIndex(
      (m) => parseISO("01-" + m.m + "-2026").toString() === "Invalid Date" // placeholder
    )
  }, [meses])

  const load = useCallback(async () => {
    const supabase = createClient()
    const today = new Date()

    // Calcular janela
    let from: Date
    if (periodo === "30d") from = addMonths(today, -1)
    else if (periodo === "90d") from = addMonths(today, -3)
    else if (periodo === "12m") from = addMonths(today, -11)
    else from = new Date(today.getFullYear(), 0, 1) // YTD

    const fromStr = format(from, "yyyy-MM-dd")
    const toStr = format(today, "yyyy-MM-dd")

    // Lançamentos do período
    const { data: lancs } = await supabase
      .from("lancamento")
      .select(
        "valor, tipo, entrada_saida, data_competencia, id_plano_conta, id_obra"
      )
      .gte("data_competencia", fromStr)
      .lte("data_competencia", toStr)

    const list = lancs ?? []

    // Por mês
    const monthMap = new Map<string, MesData>()
    let cur = startOfMonth(from)
    const todayMonth = startOfMonth(today)
    while (cur <= todayMonth || cur <= addMonths(today, 2)) {
      const key = format(cur, "yyyy-MM")
      const label = format(cur, "MMM", { locale: ptBR })
        .replace(".", "")
        .replace(/^./, (c) => c.toUpperCase())
      monthMap.set(key, {
        m: label,
        entPlan: 0,
        entReal: cur <= todayMonth ? 0 : null,
        saiPlan: 0,
        saiReal: cur <= todayMonth ? 0 : null,
      })
      cur = addMonths(cur, 1)
      if (monthMap.size >= 12) break
    }
    for (const l of list) {
      const key = l.data_competencia.substring(0, 7)
      const m = monthMap.get(key)
      if (!m) continue
      const v = Number(l.valor)
      const isEnt = l.entrada_saida === "entrada"
      if (l.tipo === "planejado") {
        if (isEnt) m.entPlan += v
        else m.saiPlan += v
      } else {
        if (isEnt && m.entReal != null) m.entReal += v
        else if (!isEnt && m.saiReal != null) m.saiReal += v
      }
    }
    setMeses(Array.from(monthMap.values()))

    // Saldo acumulado
    let accReal = 0
    let accPrev = 0
    const saldoArr: SaldoData[] = []
    for (const m of monthMap.values()) {
      accPrev += m.entPlan - m.saiPlan
      if (m.entReal != null && m.saiReal != null) {
        accReal += m.entReal - m.saiReal
        saldoArr.push({ m: m.m, real: accReal, prev: accPrev })
      } else {
        saldoArr.push({ m: m.m, real: null, prev: accPrev })
      }
    }
    setSaldoMes(saldoArr)

    // Saídas por plano de contas
    const planoIds = Array.from(
      new Set(
        list
          .filter(
            (l) =>
              l.id_plano_conta &&
              l.entrada_saida === "saida" &&
              l.tipo === "realizado"
          )
          .map((l) => l.id_plano_conta!)
      )
    )
    const { data: planos } = planoIds.length
      ? await supabase
          .from("plano_conta")
          .select("id_plano, nome")
          .in("id_plano", planoIds)
      : { data: [] as { id_plano: number; nome: string }[] }
    const planoMap = new Map(
      (planos ?? []).map((p) => [p.id_plano, p.nome as string])
    )

    const pcMap = new Map<string, number>()
    for (const l of list) {
      if (
        !l.id_plano_conta ||
        l.entrada_saida !== "saida" ||
        l.tipo !== "realizado"
      )
        continue
      const nome = planoMap.get(l.id_plano_conta) ?? "Outros"
      pcMap.set(nome, (pcMap.get(nome) ?? 0) + Number(l.valor))
    }
    setPcData(
      Array.from(pcMap.entries())
        .map(([nome, v], i) => ({
          nome,
          v,
          cor: DONUT_COLORS[i % DONUT_COLORS.length],
        }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 8)
    )

    // KPIs
    const receita = list
      .filter(
        (l) => l.entrada_saida === "entrada" && l.tipo === "realizado"
      )
      .reduce((a, l) => a + Number(l.valor), 0)
    const despesa = list
      .filter(
        (l) => l.entrada_saida === "saida" && l.tipo === "realizado"
      )
      .reduce((a, l) => a + Number(l.valor), 0)
    const saldo = receita - despesa
    const margem = receita > 0 ? (saldo / receita) * 100 : 0
    setKpis({ receita, despesa, saldo, margem })

    // Saúde das obras
    const { data: obrasRaw } = await supabase
      .from("obra")
      .select(
        "id_obra, nome, status, percentual_finalizada, id_cliente"
      )
      .neq("status", "cancelada")
    const cliIds = Array.from(
      new Set((obrasRaw ?? []).map((o) => o.id_cliente))
    )
    const { data: clientes } = cliIds.length
      ? await supabase
          .from("cliente")
          .select("id_cliente, nome")
          .in("id_cliente", cliIds)
      : { data: [] as { id_cliente: number; nome: string }[] }
    const cliMap = new Map(
      (clientes ?? []).map((c) => [c.id_cliente, c.nome as string])
    )
    const obrasArr: ObraSaude[] = (obrasRaw ?? []).slice(0, 6).map((o) => {
      const obraLancs = list.filter((l) => l.id_obra === o.id_obra)
      const orc = obraLancs
        .filter((l) => l.tipo === "planejado" && l.entrada_saida === "saida")
        .reduce((a, l) => a + Number(l.valor), 0)
      const real = obraLancs
        .filter((l) => l.tipo === "realizado" && l.entrada_saida === "saida")
        .reduce((a, l) => a + Number(l.valor), 0)
      return {
        id_obra: o.id_obra,
        id: `OBR-${String(o.id_obra).padStart(4, "0")}`,
        nome: o.nome,
        status: o.status ?? "planejamento",
        cliente: cliMap.get(o.id_cliente) ?? "—",
        pct: Math.round(o.percentual_finalizada ?? 0),
        orcamento: orc,
        realizado: real,
        variacao: orc > 0 ? ((real - orc) / orc) * 100 : 0,
      }
    })
    setObras(obrasArr)
  }, [periodo])

  useEffect(() => {
    load()
  }, [load])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: "smooth" })
    setActiveSection(id)
  }

  const todayMonthLabel = format(new Date(), "MMM", { locale: ptBR })
    .replace(".", "")
    .replace(/^./, (c) => c.toUpperCase())
  const mesIdx = meses.findIndex((m) => m.m === todayMonthLabel)

  return (
    <>
      <div className="page-head" style={{ paddingBottom: 16 }}>
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">
              Relatórios · Atualizado{" "}
              {format(new Date(), "dd 'de' MMM yyyy, HH:mm", { locale: ptBR })}
            </div>
            <h1>Dashboard financeiro</h1>
            <div className="subtitle">
              Saúde da empresa em quatro lentes — caixa, aderência ao plano,
              performance das obras e curva S.
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="download" />
              Exportar PDF
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => load()}
            >
              <Icon name="refresh" />
              Atualizar
            </button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 18,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--ink-muted)",
                fontWeight: 600,
              }}
            >
              Período
            </span>
            <div className="seg">
              {PERIODOS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={
                    "seg-btn" + (periodo === p.value ? " active" : "")
                  }
                  onClick={() => setPeriodo(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav âncoras */}
      <nav className="df-anchor-nav">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={"#" + s.id}
            className={activeSection === s.id ? "active" : ""}
            onClick={(e) => {
              e.preventDefault()
              scrollTo(s.id)
            }}
          >
            <span className="num">{s.num}</span>
            {s.label}
          </a>
        ))}
      </nav>

      {/* 01 — Visão geral */}
      <section id="visao-geral" className="df-section">
        <div className="df-section-head">
          <div>
            <div className="eyebrow">
              <span className="mono">01</span> · Visão geral
            </div>
            <h2>Receita, despesa e margem do período</h2>
          </div>
        </div>

        <div className="df-kpis">
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Receita realizada</div>
              <div className="df-kpi-icon">
                <Icon name="arrowDown" />
              </div>
            </div>
            <div className="df-kpi-value fin-pos">{fmtBRL(kpis.receita)}</div>
            <div className="df-kpi-foot">Entradas confirmadas no período</div>
          </div>
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Despesa realizada</div>
              <div className="df-kpi-icon">
                <Icon name="arrowUp" />
              </div>
            </div>
            <div className="df-kpi-value fin-neg">{fmtBRL(kpis.despesa)}</div>
            <div className="df-kpi-foot">Saídas confirmadas no período</div>
          </div>
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Saldo do período</div>
              <div className="df-kpi-icon">
                <Icon name="activity" />
              </div>
            </div>
            <div
              className={
                "df-kpi-value " + (kpis.saldo >= 0 ? "fin-pos" : "fin-neg")
              }
            >
              {fmtBRL(kpis.saldo)}
            </div>
            <div className="df-kpi-foot">Receita − Despesa</div>
          </div>
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Margem operacional</div>
              <div className="df-kpi-icon">
                <Icon name="trend" />
              </div>
            </div>
            <div
              className={
                "df-kpi-value " + (kpis.margem >= 0 ? "fin-pos" : "fin-neg")
              }
            >
              {pct(kpis.margem)}
            </div>
            <div className="df-kpi-foot">Saldo sobre receita</div>
          </div>
        </div>
      </section>

      {/* 02 — Análise */}
      <section id="analise-financeira" className="df-section">
        <div className="df-section-head">
          <div>
            <div className="eyebrow">
              <span className="mono">02</span> · Análise financeira
            </div>
            <h2>Planejado × realizado por mês</h2>
          </div>
        </div>

        <div className="df-chart-card">
          <BarsEntSaida data={meses} mesAtualIdx={mesIdx} />
          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: 14,
              flexWrap: "wrap",
              fontSize: 12,
              color: "var(--ink-muted)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 10,
                  background: "var(--success)",
                  borderRadius: 2,
                }}
              />
              Entrada realizada
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 10,
                  background: "transparent",
                  border: "1px solid var(--success)",
                  borderRadius: 2,
                }}
              />
              Entrada planejada
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 10,
                  background: "#D97706",
                  borderRadius: 2,
                }}
              />
              Saída realizada
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 10,
                  background: "transparent",
                  border: "1px solid #D97706",
                  borderRadius: 2,
                }}
              />
              Saída planejada
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginTop: 14,
          }}
        >
          <div className="df-chart-card">
            <div style={{ marginBottom: 12 }}>
              <div
                className="eyebrow"
                style={{ fontSize: 11, color: "var(--ink-muted)" }}
              >
                Saídas por plano de contas
              </div>
              <h3 style={{ fontSize: 15, margin: "4px 0 0" }}>
                Composição do período
              </h3>
            </div>
            <Donut data={pcData} totalLabel="Total" />
          </div>
          <div className="df-chart-card">
            <div style={{ marginBottom: 12 }}>
              <div
                className="eyebrow"
                style={{ fontSize: 11, color: "var(--ink-muted)" }}
              >
                Saldo acumulado
              </div>
              <h3 style={{ fontSize: 15, margin: "4px 0 0" }}>
                Real × previsto
              </h3>
            </div>
            <LinhaSaldo data={saldoMes} mesAtualIdx={mesIdx} />
            <div
              style={{
                display: "flex",
                gap: 18,
                marginTop: 8,
                fontSize: 12,
                color: "var(--ink-muted)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 2,
                    background: "var(--primary)",
                  }}
                />
                Real
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 2,
                    background: "var(--info)",
                    borderBottom: "1px dashed var(--info)",
                  }}
                />
                Previsto
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Saúde das obras */}
      <section id="saude-obras" className="df-section">
        <div className="df-section-head">
          <div>
            <div className="eyebrow">
              <span className="mono">03</span> · Saúde das obras
            </div>
            <h2>Variação orçamento × realizado por obra</h2>
          </div>
        </div>

        <div className="df-obras-grid">
          {obras.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "var(--ink-muted)",
                gridColumn: "1 / -1",
              }}
            >
              Sem obras no período.
            </div>
          ) : (
            obras.map((o) => {
              const tone =
                o.variacao > 15
                  ? "danger"
                  : o.variacao > 5
                    ? "warning"
                    : "success"
              return (
                <Link
                  key={o.id_obra}
                  href={`/obras/${o.id_obra}`}
                  className={"df-obra-card tone-" + tone}
                >
                  <div className="df-kpi-head">
                    <div
                      className="eyebrow"
                      style={{ fontSize: 11, color: "var(--ink-muted)" }}
                    >
                      {o.id}
                    </div>
                    <span className={"badge dot badge-" + tone}>
                      {o.variacao >= 0 ? "+" : ""}
                      {o.variacao.toFixed(1)}%
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: 14,
                      margin: "6px 0",
                      lineHeight: 1.3,
                    }}
                  >
                    {o.nome}
                  </h3>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-muted)",
                      marginBottom: 10,
                    }}
                  >
                    {o.cliente}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <div className="sub" style={{ marginBottom: 2 }}>
                        Orçado
                      </div>
                      <div className="mono">{fmtBRL(o.orcamento)}</div>
                    </div>
                    <div>
                      <div className="sub" style={{ marginBottom: 2 }}>
                        Realizado
                      </div>
                      <div className="mono">{fmtBRL(o.realizado)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div
                      className="obra-progress-track"
                      style={{ height: 6 }}
                    >
                      <div
                        className="obra-progress-fill"
                        style={{
                          width: o.pct + "%",
                          background:
                            tone === "danger"
                              ? "var(--danger)"
                              : tone === "warning"
                                ? "var(--warning)"
                                : "var(--success)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-muted)",
                        marginTop: 3,
                      }}
                    >
                      {o.pct}% concluída
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </section>

      {/* 04 — Curva S */}
      <section id="curva-s" className="df-section">
        <div className="df-section-head">
          <div>
            <div className="eyebrow">
              <span className="mono">04</span> · Curva S
            </div>
            <h2>Avanço acumulado do portfólio</h2>
          </div>
        </div>
        <div className="df-chart-card">
          <LinhaSaldo data={saldoMes} mesAtualIdx={mesIdx} />
          <p
            style={{
              marginTop: 12,
              fontSize: 12.5,
              color: "var(--ink-muted)",
            }}
          >
            A curva acima compara o saldo real (linha sólida) com o
            previsto (linha tracejada). Pontos abaixo da linha tracejada
            indicam atrasos financeiros vs. plano.
          </p>
        </div>
      </section>
    </>
  )
}
