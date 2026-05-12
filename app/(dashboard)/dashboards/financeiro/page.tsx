"use client"

// Port completo das 4 secoes do dashboard financeiro do design
// Inclui: DfInsights, KPIs, BarsEntSaida, Donut, LinhaSaldo, TopFornecedores,
// LinhaPlanReal (entradas + saidas), DfTblDesvios, DfEtapasBarras, DfCurvaS

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { addMonths, format, parseISO, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface MesData {
  mKey: string
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
interface FornData {
  nome: string
  realizado: number
  planejado: number
}
interface DesvioPC {
  nome: string
  codigo: string
  realizado: number
  planejado: number
  variacao: number
}
interface ObraSaude {
  id_obra: number
  id: string
  nome: string
  cliente: string
  status: string
  pctFisico: number
  pctFinanceiro: number
  margem: number
  orcamento: number
  realizado: number
  fim: string
  variacao: number
  responsavel: string
  respInit: string
}
interface InsightItem {
  tone: "ok" | "warn" | "act"
  text: ReactNode
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
function fmtPct(v: number, sign = false): string {
  const s = v.toFixed(1).replace(".", ",") + "%"
  return sign && v > 0 ? "+" + s : s
}
function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─────── DfInsights (port literal de df-shared.jsx) ───────
function DfInsights({
  tone,
  items,
}: {
  tone: "info" | "warning" | "danger"
  items: InsightItem[]
}) {
  if (items.length === 0) return null
  const toneCls =
    tone === "warning"
      ? "tone-warning"
      : tone === "danger"
        ? "tone-danger"
        : ""
  const ICONS = {
    ok: "check" as const,
    warn: "alertTriangle" as const,
    act: "zap" as const,
  }
  return (
    <div className={"df-insights " + toneCls}>
      <div className="ai-icon">
        <Icon name="sparkle" />
      </div>
      <div className="ai-body">
        <div className="ai-head">
          <div className="ai-title">
            Insights
            <span className="badge-ai">automático</span>
          </div>
        </div>
        <ul className="ai-list">
          {items.map((it, i) => (
            <li key={i} className={"t-" + it.tone}>
              <Icon name={ICONS[it.tone]} className="glyph" />
              <span>{it.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─────── Bars entrada×saída ───────
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
  const vals = data.flatMap((d) => [
    d.entPlan / 1000,
    (d.entReal ?? 0) / 1000,
    d.saiPlan / 1000,
    (d.saiReal ?? 0) / 1000,
  ])
  const max = Math.max(...vals, 1) * 1.1
  const groupW = iw / data.length
  const barW = (groupW * 0.8) / 4
  const yS = (v: number) => pad.t + ih - (v / max) * ih
  const grids = [0, max / 4, max / 2, (3 * max) / 4, max]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 240 }}>
      <defs>
        <pattern
          id="pEntPlan"
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
          id="pSaiPlan"
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
            {Math.round(g)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + i * groupW + groupW * 0.1
        const isFuture = i > mesAtualIdx
        const showReal = d.entReal != null
        return (
          <g key={i}>
            <rect
              x={cx}
              y={yS(d.entPlan / 1000)}
              width={barW}
              height={pad.t + ih - yS(d.entPlan / 1000)}
              fill="url(#pEntPlan)"
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
              fill="url(#pSaiPlan)"
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

// ─────── Donut ───────
function Donut({ data, totalLabel }: { data: PCData[]; totalLabel: string }) {
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
        Sem dados
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
          style={{ fontFamily: "serif", fontSize: 22, fill: "var(--ink)" }}
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

// ─────── LinhaSaldo ───────
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
  const max = Math.max(...todos, 1) * 1.05
  const min = Math.min(0, ...todos)
  const range = max - min || 1
  const xS = (i: number) =>
    pad.l + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2)
  const yS = (v: number) => pad.t + ih - ((v - min) / range) * ih
  const realPts = data.filter((d) => d.real != null)
  const realPath = realPts
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xS(data.indexOf(d))} ${yS(d.real!)}`
    )
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

// ─────── LinhaPlanReal (entradas ou saídas isolado) ───────
function LinhaPlanReal({
  data,
  field,
  cor,
  mesAtualIdx,
}: {
  data: MesData[]
  field: "ent" | "sai"
  cor: string
  mesAtualIdx: number
}) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height: 230,
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
  const planKey: keyof MesData = field === "ent" ? "entPlan" : "saiPlan"
  const realKey: keyof MesData = field === "ent" ? "entReal" : "saiReal"
  const w = 740,
    h = 230,
    pad = { l: 50, r: 14, t: 16, b: 28 }
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b
  const todos = data.flatMap((d) =>
    [(d[planKey] as number) / 1000, ((d[realKey] as number) ?? 0) / 1000].filter(
      (v) => v != null
    )
  )
  const max = Math.max(...todos, 1) * 1.05
  const xS = (i: number) =>
    pad.l + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2)
  const yS = (v: number) => pad.t + ih - (v / max) * ih
  const planPath = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xS(i)} ${yS((d[planKey] as number) / 1000)}`
    )
    .join(" ")
  const realPts = data.filter((d) => d[realKey] != null)
  const realPath = realPts
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${xS(data.indexOf(d))} ${yS(((d[realKey] as number) ?? 0) / 1000)}`
    )
    .join(" ")
  // Área entre real e plan (até onde tem real)
  const areaPath =
    realPts.length > 0
      ? realPath +
        " " +
        realPts
          .slice()
          .reverse()
          .map(
            (d) =>
              `L ${xS(data.indexOf(d))} ${yS((d[planKey] as number) / 1000)}`
          )
          .join(" ") +
        " Z"
      : ""
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 230 }}>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const v = max * p
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
              {Math.round(v)}
            </text>
          </g>
        )
      })}
      {areaPath ? (
        <path d={areaPath} fill={cor} opacity="0.1" />
      ) : null}
      <path
        d={planPath}
        stroke="var(--planned)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="4,3"
      />
      <path d={realPath} stroke={cor} strokeWidth="2" fill="none" />
      {realPts.map((d, i) => (
        <circle
          key={i}
          cx={xS(data.indexOf(d))}
          cy={yS(((d[realKey] as number) ?? 0) / 1000)}
          r="2.5"
          fill={cor}
        />
      ))}
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
    </svg>
  )
}

// ─────── TopFornecedores ───────
function TopFornecedores({ data }: { data: FornData[] }) {
  if (data.length === 0)
    return (
      <div
        style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "var(--ink-muted)",
          fontSize: 12,
        }}
      >
        Sem fornecedores no período
      </div>
    )
  const max = Math.max(...data.map((f) => f.realizado), 1)
  return (
    <div className="df-bars-h">
      {data.slice(0, 8).map((f, i) => {
        const pctReal = (f.realizado / max) * 100
        const pctPlan = (f.planejado / max) * 100
        const variacao =
          f.planejado > 0 ? ((f.realizado - f.planejado) / f.planejado) * 100 : 0
        const over = variacao > 5
        return (
          <div key={i} className="df-bar-h">
            <div className="df-bar-h-head">
              <div className="nm">{f.nome}</div>
              <div className="vals">
                <span className="mono">{fmtBRL(f.realizado)}</span>
                {f.planejado > 0 ? (
                  <span
                    className="var"
                    style={{
                      color: over
                        ? "var(--danger-ink)"
                        : "var(--success-ink)",
                      fontWeight: 600,
                    }}
                  >
                    {fmtPct(variacao, true)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="df-bar-h-track">
              {f.planejado > 0 ? (
                <div
                  className="plan"
                  style={{
                    width: pctPlan + "%",
                    background: "var(--planned)",
                    opacity: 0.35,
                  }}
                />
              ) : null}
              <div
                className="real"
                style={{
                  width: pctReal + "%",
                  background: over ? "var(--danger)" : "var(--primary)",
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────── Tbl desvios por PC ───────
function TblDesvios({ data }: { data: DesvioPC[] }) {
  if (data.length === 0)
    return (
      <div
        style={{
          padding: "32px 16px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Sem dados de aderência
      </div>
    )
  return (
    <table className="df-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Categoria</th>
          <th className="num">Realizado</th>
          <th className="num">Planejado</th>
          <th className="num">Variação</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.slice(0, 12).map((d, i) => {
          const tone =
            d.variacao > 15
              ? "danger"
              : d.variacao > 5
                ? "warning"
                : "success"
          const dotBg =
            tone === "danger"
              ? "var(--danger)"
              : tone === "warning"
                ? "var(--warning)"
                : "var(--success)"
          return (
            <tr key={i}>
              <td>
                <span className="mono">{d.codigo}</span>
              </td>
              <td>{d.nome}</td>
              <td className="num mono">{fmtBRL(d.realizado)}</td>
              <td className="num mono">{fmtBRL(d.planejado)}</td>
              <td
                className="num mono"
                style={{
                  color:
                    tone === "danger"
                      ? "var(--danger-ink)"
                      : tone === "warning"
                        ? "var(--warning-ink)"
                        : "var(--success-ink)",
                  fontWeight: 600,
                }}
              >
                {fmtPct(d.variacao, true)}
              </td>
              <td>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: dotBg,
                    }}
                  />
                  {tone === "danger"
                    ? "Crítico"
                    : tone === "warning"
                      ? "Atenção"
                      : "OK"}
                </span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function DashboardFinanceiroPage() {
  const [periodo, setPeriodo] =
    useState<(typeof PERIODOS)[number]["value"]>("ytd")
  const [activeSection, setActiveSection] = useState("visao-geral")
  const [meses, setMeses] = useState<MesData[]>([])
  const [saldoMes, setSaldoMes] = useState<SaldoData[]>([])
  const [pcData, setPcData] = useState<PCData[]>([])
  const [topForn, setTopForn] = useState<FornData[]>([])
  const [desvios, setDesvios] = useState<DesvioPC[]>([])
  const [obras, setObras] = useState<ObraSaude[]>([])
  const [kpis, setKpis] = useState({
    receita: 0,
    despesa: 0,
    saldo: 0,
    margem: 0,
    receitaPlan: 0,
    despesaPlan: 0,
  })

  const load = useCallback(async () => {
    const supabase = createClient()
    const today = new Date()
    let from: Date
    if (periodo === "30d") from = addMonths(today, -1)
    else if (periodo === "90d") from = addMonths(today, -3)
    else if (periodo === "12m") from = addMonths(today, -11)
    else from = new Date(today.getFullYear(), 0, 1)

    const fromStr = format(from, "yyyy-MM-dd")
    const toFutureStr = format(addMonths(today, 3), "yyyy-MM-dd")

    const { data: lancs } = await supabase
      .from("lancamento")
      .select(
        "valor, tipo, entrada_saida, data_competencia, id_plano_conta, id_obra, id_fornecedor"
      )
      .gte("data_competencia", fromStr)
      .lte("data_competencia", toFutureStr)

    const list = lancs ?? []

    // Por mês
    const monthMap = new Map<string, MesData>()
    let cur = startOfMonth(from)
    const todayMonth = startOfMonth(today)
    const limitMonth = startOfMonth(addMonths(today, 2))
    while (cur <= limitMonth) {
      const key = format(cur, "yyyy-MM")
      const label = format(cur, "MMM", { locale: ptBR })
        .replace(".", "")
        .replace(/^./, (c) => c.toUpperCase())
      monthMap.set(key, {
        mKey: key,
        m: label,
        entPlan: 0,
        entReal: cur <= todayMonth ? 0 : null,
        saiPlan: 0,
        saiReal: cur <= todayMonth ? 0 : null,
      })
      cur = addMonths(cur, 1)
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
    const mesesArr = Array.from(monthMap.values())
    setMeses(mesesArr)

    // Saldo
    let accReal = 0
    let accPrev = 0
    const saldoArr: SaldoData[] = []
    for (const m of mesesArr) {
      accPrev += m.entPlan - m.saiPlan
      if (m.entReal != null && m.saiReal != null) {
        accReal += m.entReal - m.saiReal
        saldoArr.push({ m: m.m, real: accReal, prev: accPrev })
      } else {
        saldoArr.push({ m: m.m, real: null, prev: accPrev })
      }
    }
    setSaldoMes(saldoArr)

    // ── Lookups ──
    const planoIds = Array.from(
      new Set(list.filter((l) => l.id_plano_conta).map((l) => l.id_plano_conta!))
    )
    const fornIds = Array.from(
      new Set(list.filter((l) => l.id_fornecedor).map((l) => l.id_fornecedor!))
    )
    const [{ data: planos }, { data: forns }] = await Promise.all([
      planoIds.length
        ? supabase
            .from("plano_conta")
            .select("id_plano, codigo, nome")
            .in("id_plano", planoIds)
        : Promise.resolve({
            data: [] as { id_plano: number; codigo: string | null; nome: string }[],
          }),
      fornIds.length
        ? supabase
            .from("fornecedor")
            .select("id_fornecedor, nome")
            .in("id_fornecedor", fornIds)
        : Promise.resolve({
            data: [] as { id_fornecedor: number; nome: string }[],
          }),
    ])
    const planoMap = new Map(
      (planos ?? []).map((p) => [
        p.id_plano,
        { codigo: p.codigo ?? "—", nome: p.nome },
      ])
    )
    const fornMap = new Map(
      (forns ?? []).map((f) => [f.id_fornecedor, f.nome as string])
    )

    // Saídas por PC (donut)
    const pcMap = new Map<string, number>()
    for (const l of list) {
      if (
        !l.id_plano_conta ||
        l.entrada_saida !== "saida" ||
        l.tipo !== "realizado"
      )
        continue
      const nome = planoMap.get(l.id_plano_conta)?.nome ?? "Outros"
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

    // Top fornecedores
    const fornMapVal = new Map<
      number,
      { realizado: number; planejado: number }
    >()
    for (const l of list) {
      if (!l.id_fornecedor || l.entrada_saida !== "saida") continue
      const cur = fornMapVal.get(l.id_fornecedor) ?? {
        realizado: 0,
        planejado: 0,
      }
      const v = Number(l.valor)
      if (l.tipo === "realizado") cur.realizado += v
      else cur.planejado += v
      fornMapVal.set(l.id_fornecedor, cur)
    }
    setTopForn(
      Array.from(fornMapVal.entries())
        .map(([id, v]) => ({
          nome: fornMap.get(id) ?? `Fornecedor ${id}`,
          realizado: v.realizado,
          planejado: v.planejado,
        }))
        .sort((a, b) => b.realizado - a.realizado)
        .slice(0, 8)
    )

    // Desvios por PC
    const desviosMap = new Map<
      number,
      { codigo: string; nome: string; realizado: number; planejado: number }
    >()
    for (const l of list) {
      if (!l.id_plano_conta || l.entrada_saida !== "saida") continue
      const meta = planoMap.get(l.id_plano_conta)
      if (!meta) continue
      const cur =
        desviosMap.get(l.id_plano_conta) ?? {
          codigo: meta.codigo,
          nome: meta.nome,
          realizado: 0,
          planejado: 0,
        }
      const v = Number(l.valor)
      if (l.tipo === "realizado") cur.realizado += v
      else cur.planejado += v
      desviosMap.set(l.id_plano_conta, cur)
    }
    setDesvios(
      Array.from(desviosMap.values())
        .filter((d) => d.realizado > 0 || d.planejado > 0)
        .map((d) => ({
          ...d,
          variacao:
            d.planejado > 0 ? ((d.realizado - d.planejado) / d.planejado) * 100 : 0,
        }))
        .sort((a, b) => Math.abs(b.variacao) - Math.abs(a.variacao))
    )

    // KPIs gerais
    const receita = list
      .filter((l) => l.entrada_saida === "entrada" && l.tipo === "realizado")
      .reduce((a, l) => a + Number(l.valor), 0)
    const despesa = list
      .filter((l) => l.entrada_saida === "saida" && l.tipo === "realizado")
      .reduce((a, l) => a + Number(l.valor), 0)
    const receitaPlan = list
      .filter((l) => l.entrada_saida === "entrada" && l.tipo === "planejado")
      .reduce((a, l) => a + Number(l.valor), 0)
    const despesaPlan = list
      .filter((l) => l.entrada_saida === "saida" && l.tipo === "planejado")
      .reduce((a, l) => a + Number(l.valor), 0)
    const saldo = receita - despesa
    const margem = receita > 0 ? (saldo / receita) * 100 : 0
    setKpis({ receita, despesa, saldo, margem, receitaPlan, despesaPlan })

    // Saúde das obras
    const { data: obrasRaw } = await supabase
      .from("obra")
      .select(
        "id_obra, nome, status, percentual_finalizada, id_cliente, id_responsavel, data_fim_prevista"
      )
      .neq("status", "cancelada")
    const cliIds = Array.from(new Set((obrasRaw ?? []).map((o) => o.id_cliente)))
    const respIds = Array.from(
      new Set(
        (obrasRaw ?? [])
          .filter((o) => o.id_responsavel)
          .map((o) => o.id_responsavel!)
      )
    )
    const [{ data: clientes }, { data: resps }] = await Promise.all([
      cliIds.length
        ? supabase
            .from("cliente")
            .select("id_cliente, nome")
            .in("id_cliente", cliIds)
        : Promise.resolve({
            data: [] as { id_cliente: number; nome: string }[],
          }),
      respIds.length
        ? supabase
            .from("responsavel")
            .select("id_responsavel, nome")
            .in("id_responsavel", respIds)
        : Promise.resolve({
            data: [] as { id_responsavel: number; nome: string }[],
          }),
    ])
    const cliMap = new Map(
      (clientes ?? []).map((c) => [c.id_cliente, c.nome as string])
    )
    const respMap = new Map(
      (resps ?? []).map((r) => [r.id_responsavel, r.nome as string])
    )
    setObras(
      (obrasRaw ?? []).slice(0, 8).map((o) => {
        const obraLancs = list.filter((l) => l.id_obra === o.id_obra)
        const orc = obraLancs
          .filter(
            (l) => l.tipo === "planejado" && l.entrada_saida === "saida"
          )
          .reduce((a, l) => a + Number(l.valor), 0)
        const real = obraLancs
          .filter(
            (l) => l.tipo === "realizado" && l.entrada_saida === "saida"
          )
          .reduce((a, l) => a + Number(l.valor), 0)
        const entrada = obraLancs
          .filter(
            (l) => l.tipo === "realizado" && l.entrada_saida === "entrada"
          )
          .reduce((a, l) => a + Number(l.valor), 0)
        const variacao = orc > 0 ? ((real - orc) / orc) * 100 : 0
        const pctFisico = Math.round(o.percentual_finalizada ?? 0)
        const pctFinanceiro = orc > 0 ? Math.round((real / orc) * 100) : 0
        const margem = entrada > 0 ? ((entrada - real) / entrada) * 100 : 0
        const respNome = o.id_responsavel
          ? respMap.get(o.id_responsavel) ?? ""
          : ""
        return {
          id_obra: o.id_obra,
          id: `OBR-${String(o.id_obra).padStart(4, "0")}`,
          nome: o.nome,
          status: o.status ?? "planejamento",
          cliente: cliMap.get(o.id_cliente) ?? "—",
          pctFisico,
          pctFinanceiro,
          margem,
          orcamento: orc,
          realizado: real,
          fim: o.data_fim_prevista
            ? format(parseISO(o.data_fim_prevista), "dd/MM/yy")
            : "—",
          variacao,
          responsavel: respNome,
          respInit: getInitials(respNome),
        }
      })
    )
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

  // Aderência
  const aderEnt = kpis.receitaPlan > 0 ? (kpis.receita / kpis.receitaPlan) * 100 : 0
  const aderSai = kpis.despesaPlan > 0 ? (kpis.despesa / kpis.despesaPlan) * 100 : 0
  const lucroPlan = kpis.receitaPlan - kpis.despesaPlan
  const aderLucro =
    lucroPlan > 0 ? (kpis.saldo / lucroPlan) * 100 : kpis.saldo >= 0 ? 100 : 0

  // Insights
  const insightsVisao = useMemo<InsightItem[]>(() => {
    const arr: InsightItem[] = []
    if (kpis.receitaPlan > 0) {
      const variacao =
        ((kpis.receita - kpis.receitaPlan) / kpis.receitaPlan) * 100
      if (Math.abs(variacao) > 5) {
        arr.push({
          tone: variacao > 0 ? "ok" : "warn",
          text: (
            <>
              Receita do período <strong>{fmtBRL(kpis.receita)}</strong> está{" "}
              <strong>{fmtPct(variacao, true)}</strong>{" "}
              {variacao > 0 ? "acima" : "abaixo"} do planejado.
            </>
          ),
        })
      }
    }
    if (kpis.despesaPlan > 0) {
      const variacao =
        ((kpis.despesa - kpis.despesaPlan) / kpis.despesaPlan) * 100
      if (variacao > 10) {
        arr.push({
          tone: "warn",
          text: (
            <>
              Despesa está <strong>{fmtPct(variacao, true)}</strong> acima do
              planejado — revisar categorias com maior desvio.
            </>
          ),
        })
      }
    }
    if (kpis.saldo < 0) {
      arr.push({
        tone: "act",
        text: (
          <>
            Saldo negativo no período <strong>{fmtBRL(kpis.saldo)}</strong>.
            Antecipar medições ou revisar pagamentos.
          </>
        ),
      })
    }
    if (arr.length === 0) {
      arr.push({
        tone: "ok",
        text: (
          <>
            Resultado financeiro dentro do esperado. Margem operacional de{" "}
            <strong>{fmtPct(kpis.margem)}</strong>.
          </>
        ),
      })
    }
    return arr
  }, [kpis])

  const insightsAnalise = useMemo<InsightItem[]>(() => {
    const arr: InsightItem[] = []
    if (aderSai > 105) {
      arr.push({
        tone: "warn",
        text: (
          <>
            Saídas <strong>{fmtPct(aderSai - 100, true)}</strong> acima do
            planejado — pressão nas categorias com maior variação.
          </>
        ),
      })
    }
    if (Math.abs(aderEnt - 100) > 5) {
      arr.push({
        tone: aderEnt >= 95 ? "ok" : "warn",
        text: (
          <>
            Entradas vieram <strong>{fmtPct(aderEnt - 100, true)}</strong> do
            plano.
          </>
        ),
      })
    }
    if (desvios.length > 0 && desvios[0].variacao > 15) {
      arr.push({
        tone: "act",
        text: (
          <>
            Categoria <strong>{desvios[0].nome}</strong> com{" "}
            <strong>{fmtPct(desvios[0].variacao, true)}</strong> de variação —
            considerar reorçar.
          </>
        ),
      })
    }
    if (arr.length === 0) {
      arr.push({
        tone: "ok",
        text: <>Aderência ao plano dentro do esperado.</>,
      })
    }
    return arr
  }, [aderEnt, aderSai, desvios])

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
                  className={"seg-btn" + (periodo === p.value ? " active" : "")}
                  onClick={() => setPeriodo(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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
            <h2>Receita, despesa, saldo e margem do período</h2>
          </div>
        </div>

        <DfInsights tone="info" items={insightsVisao} />

        <div className="df-kpis">
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Receita realizada</div>
              <div className="df-kpi-icon">
                <Icon name="trendingUp" />
              </div>
            </div>
            <div className="df-kpi-value fin-pos">{fmtBRL(kpis.receita)}</div>
            <div className="df-kpi-foot">
              Plan. {fmtBRL(kpis.receitaPlan)}
            </div>
          </div>
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Despesa realizada</div>
              <div className="df-kpi-icon">
                <Icon name="trendingDown" />
              </div>
            </div>
            <div className="df-kpi-value fin-neg">{fmtBRL(kpis.despesa)}</div>
            <div className="df-kpi-foot">
              Plan. {fmtBRL(kpis.despesaPlan)}
            </div>
          </div>
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Saldo do período</div>
              <div className="df-kpi-icon">
                <Icon name="wallet" />
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
                <Icon name="dollar" />
              </div>
            </div>
            <div
              className={
                "df-kpi-value " + (kpis.margem >= 0 ? "fin-pos" : "fin-neg")
              }
            >
              {fmtPct(kpis.margem)}
            </div>
            <div className="df-kpi-foot">Saldo sobre receita</div>
          </div>
        </div>

        {/* Linha 1: barras + donut */}
        <div className="df-grid-23">
          <div className="df-chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Entradas × Saídas por mês</div>
                <div className="chart-sub">
                  Em milhares — barras claras = planejado, sólidas = realizado
                </div>
              </div>
              <div className="legend">
                <span className="item">
                  <span
                    className="swatch"
                    style={{ background: "var(--success)" }}
                  ></span>
                  Entradas
                </span>
                <span className="item">
                  <span
                    className="swatch"
                    style={{ background: "#D97706" }}
                  ></span>
                  Saídas
                </span>
              </div>
            </div>
            <BarsEntSaida data={meses} mesAtualIdx={mesIdx} />
          </div>
          <div className="df-chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Saídas por plano de contas</div>
                <div className="chart-sub">Top 8 categorias</div>
              </div>
            </div>
            <Donut data={pcData} totalLabel="Total" />
          </div>
        </div>

        {/* Linha 2: saldo + top fornecedores */}
        <div className="df-grid-23">
          <div className="df-chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Saldo por mês</div>
                <div className="chart-sub">
                  Acumulado · tracejado = previsto, sólida = realizado
                </div>
              </div>
              <div className="legend">
                <span className="item">
                  <span
                    className="swatch line"
                    style={{ background: "var(--primary)" }}
                  ></span>
                  Real
                </span>
                <span className="item">
                  <span className="swatch dashed"></span>Previsto
                </span>
              </div>
            </div>
            <LinhaSaldo data={saldoMes} mesAtualIdx={mesIdx} />
          </div>
          <div className="df-chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">Top fornecedores</div>
                <div className="chart-sub">Comparado ao planejado</div>
              </div>
            </div>
            <TopFornecedores data={topForn} />
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
            <h2>Aderência ao plano por linha</h2>
          </div>
        </div>

        <DfInsights tone="warning" items={insightsAnalise} />

        <div
          className="df-kpis"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Aderência de entradas</div>
              <div className="df-kpi-icon">
                <Icon name="trendingUp" />
              </div>
            </div>
            <div
              className={
                "df-kpi-value " +
                (aderEnt >= 95 ? "fin-pos" : "fin-neg")
              }
            >
              {fmtPct(aderEnt)}
            </div>
            <div className="df-kpi-foot">
              Real {fmtBRL(kpis.receita)} · Plan. {fmtBRL(kpis.receitaPlan)}
            </div>
          </div>
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Aderência de saídas</div>
              <div className="df-kpi-icon">
                <Icon name="trendingDown" />
              </div>
            </div>
            <div
              className={
                "df-kpi-value " +
                (aderSai <= 105 ? "fin-pos" : aderSai <= 115 ? "" : "fin-neg")
              }
            >
              {fmtPct(aderSai)}
            </div>
            <div className="df-kpi-foot">
              Real {fmtBRL(kpis.despesa)} · Plan. {fmtBRL(kpis.despesaPlan)}
            </div>
          </div>
          <div className="df-kpi">
            <div className="df-kpi-head">
              <div className="df-kpi-label">Aderência de lucro</div>
              <div className="df-kpi-icon">
                <Icon name="dollar" />
              </div>
            </div>
            <div
              className={
                "df-kpi-value " +
                (aderLucro >= 90 ? "fin-pos" : aderLucro >= 70 ? "" : "fin-neg")
              }
            >
              {fmtPct(aderLucro)}
            </div>
            <div className="df-kpi-foot">
              Real {fmtBRL(kpis.saldo)} · Plan. {fmtBRL(lucroPlan)}
            </div>
          </div>
        </div>

        <div className="df-grid-12">
          <div className="df-chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">
                  Entradas — planejado × realizado
                </div>
                <div className="chart-sub">
                  Em milhares · área sombreada = gap
                </div>
              </div>
              <div className="legend">
                <span className="item">
                  <span className="swatch dashed"></span>Planejado
                </span>
                <span className="item">
                  <span
                    className="swatch line"
                    style={{ background: "var(--success)" }}
                  ></span>
                  Realizado
                </span>
              </div>
            </div>
            <LinhaPlanReal
              data={meses}
              field="ent"
              cor="var(--success)"
              mesAtualIdx={mesIdx}
            />
          </div>
          <div className="df-chart-card">
            <div className="chart-head">
              <div>
                <div className="chart-title">
                  Saídas — planejado × realizado
                </div>
                <div className="chart-sub">
                  Em milhares · área sombreada = excesso
                </div>
              </div>
              <div className="legend">
                <span className="item">
                  <span className="swatch dashed"></span>Planejado
                </span>
                <span className="item">
                  <span
                    className="swatch line"
                    style={{ background: "#D97706" }}
                  ></span>
                  Realizado
                </span>
              </div>
            </div>
            <LinhaPlanReal
              data={meses}
              field="sai"
              cor="#D97706"
              mesAtualIdx={mesIdx}
            />
          </div>
        </div>

        <div className="df-chart-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 18px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div>
              <div className="chart-title">Aderência por plano de contas</div>
              <div className="chart-sub">
                Onde o orçamento mais desviou no período
              </div>
            </div>
            <div className="legend">
              <span className="item">
                <span
                  className="swatch"
                  style={{ background: "var(--success)" }}
                ></span>
                ≤ 105%
              </span>
              <span className="item">
                <span
                  className="swatch"
                  style={{ background: "var(--warning)" }}
                ></span>
                106-115%
              </span>
              <span className="item">
                <span
                  className="swatch"
                  style={{ background: "var(--danger)" }}
                ></span>
                {"> "}115%
              </span>
            </div>
          </div>
          <TblDesvios data={desvios} />
        </div>
      </section>

      {/* 03 — Saúde das obras */}
      <section id="saude-obras" className="df-section">
        <div className="df-section-head">
          <div>
            <div className="eyebrow">
              <span className="mono">03</span> · Saúde das obras
            </div>
            <h2>Físico × financeiro por obra</h2>
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
              const saude =
                o.variacao > 15
                  ? "danger"
                  : o.variacao > 5
                    ? "warning"
                    : "success"
              return (
                <Link
                  key={o.id_obra}
                  href={`/obras/${o.id_obra}`}
                  className={"df-obra-card saude-" + saude}
                >
                  <div className="oc-head">
                    <div>
                      <h3 className="oc-title" title={o.nome}>
                        {o.nome}
                      </h3>
                      <div className="oc-cliente">{o.cliente}</div>
                    </div>
                    <div>
                      <div className="oc-id">{o.id}</div>
                    </div>
                  </div>
                  <div className="oc-bars">
                    <div className="oc-bar">
                      <span className="lbl">Físico</span>
                      <div className="track">
                        <div
                          className="fill"
                          style={{
                            width: o.pctFisico + "%",
                            background: "var(--success)",
                          }}
                        />
                      </div>
                      <span className="pct">{o.pctFisico}%</span>
                    </div>
                    <div className="oc-bar">
                      <span className="lbl">Financeiro</span>
                      <div className="track">
                        <div
                          className="fill"
                          style={{
                            width: Math.min(o.pctFinanceiro, 100) + "%",
                            background: "#D97706",
                          }}
                        />
                      </div>
                      <span className="pct">{o.pctFinanceiro}%</span>
                    </div>
                  </div>
                  <div className="oc-mini">
                    <div className="item">
                      <Icon name="dollar" />
                      <span>
                        Margem <span className="n">{fmtPct(o.margem)}</span>
                      </span>
                    </div>
                    <div className="item">
                      <Icon name="calendar" />
                      <span>
                        Entrega <span className="n">{o.fim}</span>
                      </span>
                    </div>
                    <div className="item">
                      <Icon name="activity" />
                      <span>
                        Variação{" "}
                        <span
                          className="n"
                          style={{
                            color:
                              saude === "danger"
                                ? "var(--danger-ink)"
                                : saude === "warning"
                                  ? "var(--warning-ink)"
                                  : "var(--success-ink)",
                          }}
                        >
                          {fmtPct(o.variacao, true)}
                        </span>
                      </span>
                    </div>
                    {o.respInit ? (
                      <div className="item">
                        <Icon name="user" />
                        <span>
                          {o.respInit} ·{" "}
                          <span className="n">
                            {o.responsavel.split(" ")[0]}
                          </span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="oc-foot">
                    <span>Orçado {fmtBRL(o.orcamento)}</span>
                    <span>Real {fmtBRL(o.realizado)}</span>
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
          <div className="chart-head">
            <div>
              <div className="chart-title">
                Saldo acumulado · planejado × realizado
              </div>
              <div className="chart-sub">
                Pontos abaixo da linha tracejada indicam atrasos financeiros
              </div>
            </div>
            <div className="legend">
              <span className="item">
                <span
                  className="swatch line"
                  style={{ background: "var(--primary)" }}
                ></span>
                Realizado
              </span>
              <span className="item">
                <span className="swatch dashed"></span>Planejado
              </span>
            </div>
          </div>
          <LinhaSaldo data={saldoMes} mesAtualIdx={mesIdx} />
        </div>
      </section>
    </>
  )
}
