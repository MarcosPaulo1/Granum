"use client"

// Port literal completo de granum-design/dashboard-app.jsx + Dashboard.html
// Inclui: hero, KPIs cols-5, quick-actions, atencao agora, agenda da semana,
// saidas por plano de contas, mini obras, curva S mini (SVG), fluxo caixa (SVG)

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  addDays,
  addMonths,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/granum/icon"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"

interface MiniObra {
  id: string
  rawId: number
  nome: string
  resp: string
  pct: number
  status: "ok" | "danger" | "pausa" | "plan"
  atraso?: string | false
  faltam?: string
}

interface AttnItem {
  id: string
  tone: "danger" | "warning" | "info"
  icon: string
  title: React.ReactNode
  meta: (string | { type: "pill" | "pill-danger"; text: string })[]
  actions: { label: string; href?: string; primary?: boolean; danger?: boolean }[]
}

interface WeekDay {
  dow: string
  dom: number
  today?: boolean
  past?: boolean
  events: { type: "pgto" | "recb" | "entrega" | "visita" | "marco"; title: string; meta: string }[]
}

interface SaidaPC {
  conta: string
  codigo: string
  valor: number
  delta: number
}

interface CurvaPoint {
  m: string
  plan: number | null
  real: number | null
}

interface FluxoPoint {
  sem: string
  rec: number
  desp: number
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtBRL(v: number): string {
  if (!v) return "R$ 0"
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000) return "R$ " + Math.round(v / 1000) + " mil"
  return "R$ " + v
}

function ObraDot({ status }: { status: MiniObra["status"] }) {
  const cor =
    status === "danger"
      ? "var(--danger)"
      : status === "pausa"
        ? "var(--warning)"
        : status === "plan"
          ? "var(--planned)"
          : "var(--info)"
  return <span className="dash-status-dot" style={{ background: cor }} />
}

function MiniObraCard({ o }: { o: MiniObra }) {
  let cor = "var(--info)"
  if (o.status === "danger") cor = "var(--danger)"
  else if (o.status === "pausa") cor = "var(--warning)"
  else if (o.status === "plan") cor = "var(--planned)"
  else if (o.pct >= 85) cor = "var(--success)"
  return (
    <Link
      href={`/obras/${o.rawId}`}
      className={"dash-obra" + (o.status === "danger" ? " is-danger" : "")}
    >
      <div className="dash-obra-top">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="dash-obra-name">
            <ObraDot status={o.status} /> {o.nome}
          </div>
          <div className="dash-obra-id">{o.id}</div>
        </div>
        {o.resp ? (
          <span className="avatar-xs" title={o.resp}>
            {getInitials(o.resp)}
          </span>
        ) : null}
      </div>
      <div className="dash-obra-prog">
        <div className="track">
          <div
            className="fill"
            style={{ width: o.pct + "%", background: cor }}
          />
        </div>
        <div className="pct mono">{o.pct}%</div>
      </div>
      <div className="dash-obra-foot">
        {o.status === "danger" && o.atraso ? (
          <span className="danger-tag">
            <Icon name="alertTriangle" />
            {o.atraso}
          </span>
        ) : o.status === "pausa" ? (
          <span style={{ color: "var(--warning-ink)", fontWeight: 500 }}>
            Pausada
          </span>
        ) : o.faltam ? (
          <span>{o.faltam}</span>
        ) : (
          <span>Em andamento</span>
        )}
        <span
          style={{
            color: "var(--primary)",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          Abrir <Icon name="arrowRight" />
        </span>
      </div>
    </Link>
  )
}

function CurvaSMini({ data }: { data: CurvaPoint[] }) {
  const w = 420,
    h = 140,
    pad = { l: 28, r: 12, t: 10, b: 22 }
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b
  if (data.length === 0) {
    return (
      <div
        style={{
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-muted)",
          fontSize: 12,
        }}
      >
        Sem dados de curva S
      </div>
    )
  }
  const x = (i: number) =>
    pad.l + (data.length > 1 ? (i / (data.length - 1)) * iw : iw / 2)
  const y = (v: number) => pad.t + ih - (v / 100) * ih
  const planSeries = data.filter((d) => d.plan != null)
  const realSeries = data.filter((d) => d.real != null)
  const pathP = planSeries
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(data.indexOf(d))} ${y(d.plan!)}`)
    .join(" ")
  const pathR = realSeries
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(data.indexOf(d))} ${y(d.real!)}`)
    .join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 140 }}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            y1={y(v)}
            x2={w - pad.r}
            y2={y(v)}
            stroke="var(--line)"
            strokeWidth="0.5"
          />
          <text
            x={pad.l - 6}
            y={y(v) + 3}
            fontSize="9"
            fill="var(--ink-muted)"
            textAnchor="end"
          >
            {v}%
          </text>
        </g>
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={x(i)}
          y={h - 6}
          fontSize="9"
          fill="var(--ink-muted)"
          textAnchor="middle"
        >
          {d.m}
        </text>
      ))}
      <path
        d={pathP}
        stroke="var(--info)"
        strokeWidth="1.4"
        fill="none"
        strokeDasharray="3 3"
      />
      <path d={pathR} stroke="var(--success)" strokeWidth="2" fill="none" />
      {realSeries.map((d, i) => (
        <circle
          key={i}
          cx={x(data.indexOf(d))}
          cy={y(d.real!)}
          r="2.5"
          fill="var(--success)"
        />
      ))}
    </svg>
  )
}

function FluxoMini({ data }: { data: FluxoPoint[] }) {
  const w = 420,
    h = 140,
    pad = { l: 32, r: 12, t: 10, b: 22 }
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b
  const max = Math.max(
    280,
    ...data.map((d) => Math.max(d.rec, d.desp) / 1000 || 0)
  )
  if (data.length === 0) {
    return (
      <div
        style={{
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-muted)",
          fontSize: 12,
        }}
      >
        Sem dados de fluxo
      </div>
    )
  }
  const bw = (iw / data.length) * 0.7
  const gap = (iw / data.length) * 0.3
  const y = (v: number) => pad.t + ih - (v / max) * ih
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 140 }}>
      {[0, max / 2, max].map((v, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            y1={y(v)}
            x2={w - pad.r}
            y2={y(v)}
            stroke="var(--line)"
            strokeWidth="0.5"
          />
          <text
            x={pad.l - 6}
            y={y(v) + 3}
            fontSize="9"
            fill="var(--ink-muted)"
            textAnchor="end"
          >
            {Math.round(v)}k
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = pad.l + gap / 2 + i * (bw + gap)
        const bw2 = bw / 2 - 2
        const recK = d.rec / 1000
        const despK = d.desp / 1000
        return (
          <g key={i}>
            <rect
              x={cx}
              y={y(recK)}
              width={bw2}
              height={ih - (y(recK) - pad.t)}
              fill="var(--success)"
              rx="2"
            />
            <rect
              x={cx + bw2 + 3}
              y={y(despK)}
              width={bw2}
              height={ih - (y(despK) - pad.t)}
              fill="var(--danger)"
              rx="2"
            />
            <text
              x={cx + bw / 2}
              y={h - 6}
              fontSize="9"
              fill="var(--ink-muted)"
              textAnchor="middle"
            >
              {d.sem}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function DashboardGeralPage() {
  const { responsavel } = useUser()
  const [obras, setObras] = useState<MiniObra[]>([])
  const [pagar7d, setPagar7d] = useState(0)
  const [boletosPend, setBoletosPend] = useState(0)
  const [receber7d, setReceber7d] = useState(0)
  const [saldoCaixa, setSaldoCaixa] = useState(0)
  const [atencao, setAtencao] = useState<AttnItem[]>([])
  const [semana, setSemana] = useState<WeekDay[]>([])
  const [saidasPC, setSaidasPC] = useState<SaidaPC[]>([])
  const [saidasTotal, setSaidasTotal] = useState(0)
  const [curvaS, setCurvaS] = useState<CurvaPoint[]>([])
  const [fluxo, setFluxo] = useState<FluxoPoint[]>([])
  const [, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const today = new Date()
    const todayStr = format(today, "yyyy-MM-dd")

    // ---------- OBRAS ----------
    const { data: obrasRaw } = await supabase
      .from("obra")
      .select("*")
      .neq("status", "cancelada")
      .order("created_at", { ascending: false })

    const respIds = Array.from(
      new Set(
        (obrasRaw ?? [])
          .filter((o) => o.id_responsavel)
          .map((o) => o.id_responsavel!)
      )
    )
    const { data: resps } = respIds.length
      ? await supabase
          .from("responsavel")
          .select("id_responsavel, nome")
          .in("id_responsavel", respIds)
      : { data: [] as { id_responsavel: number; nome: string }[] }
    const respMap = new Map(
      (resps ?? []).map((r) => [r.id_responsavel, r.nome as string])
    )

    const minisAll: MiniObra[] = (obrasRaw ?? []).map((o) => {
      let status: MiniObra["status"] = "ok"
      if (o.status === "pausada") status = "pausa"
      else if (o.status === "planejamento") status = "plan"
      const fim = o.data_fim_prevista ? parseISO(o.data_fim_prevista) : null
      const atrasado = fim && fim < today && o.status === "em_andamento"
      if (atrasado) status = "danger"
      const diasFalta = fim
        ? Math.ceil((fim.getTime() - today.getTime()) / 86_400_000)
        : 0
      return {
        id: `OBR-${String(o.id_obra).padStart(4, "0")}`,
        rawId: o.id_obra,
        nome: o.nome,
        resp: o.id_responsavel ? respMap.get(o.id_responsavel) ?? "" : "",
        pct: Math.round(o.percentual_finalizada ?? 0),
        status,
        atraso: atrasado
          ? `${Math.abs(diasFalta)} dias atrás no cronograma`
          : false,
        faltam:
          !atrasado && status === "ok" && diasFalta > 0 && diasFalta < 30
            ? `${diasFalta} dias p/ entrega`
            : undefined,
      }
    })
    setObras(minisAll.slice(0, 6))

    // ---------- PARCELAS ----------
    const in7 = format(addDays(today, 7), "yyyy-MM-dd")
    const { data: parcelas } = await supabase
      .from("vw_contas_a_pagar")
      .select("*")
      .neq("status", "pago")

    const parcs = parcelas ?? []
    const totalPagarSemana = parcs
      .filter(
        (p) =>
          p.data_vencimento &&
          p.data_vencimento <= in7 &&
          p.data_vencimento >= todayStr
      )
      .reduce((a, p) => a + Number(p.valor ?? 0), 0)
    setPagar7d(totalPagarSemana)
    setBoletosPend(
      parcs.filter(
        (p) =>
          p.data_vencimento &&
          p.data_vencimento <= in7 &&
          p.data_vencimento >= todayStr
      ).length
    )

    // ---------- ATENÇÃO AGORA ----------
    const atencaoItems: AttnItem[] = []
    // Obras atrasadas
    minisAll
      .filter((o) => o.status === "danger")
      .slice(0, 2)
      .forEach((o) =>
        atencaoItems.push({
          id: `obra-${o.rawId}`,
          tone: "danger",
          icon: "alertTriangle",
          title: (
            <>
              <b>{o.nome}</b> está {o.atraso}
            </>
          ),
          meta: [
            o.id,
            { type: "pill-danger", text: "Cronograma" },
          ],
          actions: [
            { label: "Ver obra", href: `/obras/${o.rawId}`, primary: true },
          ],
        })
      )
    // Parcelas atrasadas
    parcs
      .filter((p) => p.status_real === "atrasado")
      .slice(0, 3)
      .forEach((p) =>
        atencaoItems.push({
          id: `parc-${p.id_parcela}`,
          tone: "danger",
          icon: "receipt",
          title: (
            <>
              Boleto <b>{p.fornecedor ?? "—"}</b> · {fmtBRL(Number(p.valor ?? 0))}{" "}
              está atrasado
            </>
          ),
          meta: [
            p.fornecedor ?? "",
            p.obra ?? "",
            {
              type: "pill-danger",
              text: `${Math.abs(p.dias_para_vencer ?? 0)} dias`,
            },
          ],
          actions: [
            {
              label: "Pagar",
              href: "/financeiro/contas",
              danger: true,
            },
          ],
        })
      )
    // Parcelas vencendo amanhã
    const tomorrow = format(addDays(today, 1), "yyyy-MM-dd")
    parcs
      .filter((p) => p.data_vencimento === tomorrow)
      .slice(0, 2)
      .forEach((p) =>
        atencaoItems.push({
          id: `parc-tom-${p.id_parcela}`,
          tone: "warning",
          icon: "clock",
          title: (
            <>
              Boleto <b>{p.fornecedor ?? "—"}</b> · {fmtBRL(Number(p.valor ?? 0))}{" "}
              vence <b>amanhã</b>
            </>
          ),
          meta: [p.fornecedor ?? "", p.obra ?? ""],
          actions: [
            {
              label: "Pagar",
              href: "/financeiro/contas",
              primary: true,
            },
          ],
        })
      )
    // Diários pendentes (limitado)
    const { count: diariosPend } = await supabase
      .from("diario_obra")
      .select("*", { count: "exact", head: true })
      .eq("status_revisao", "pendente")
    if ((diariosPend ?? 0) > 0) {
      atencaoItems.push({
        id: "diarios-pend",
        tone: "info",
        icon: "fileText",
        title: (
          <>
            <b>{diariosPend}</b> diário{diariosPend !== 1 ? "s" : ""} de obra
            aguardando revisão
          </>
        ),
        meta: ["Diretoria"],
        actions: [
          { label: "Revisar", href: "/obras", primary: true },
        ],
      })
    }
    setAtencao(atencaoItems)

    // ---------- AGENDA DA SEMANA ----------
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    const days: WeekDay[] = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i)
      const dateStr = format(d, "yyyy-MM-dd")
      const events: WeekDay["events"] = []
      // Pagamentos do dia
      const pgtoSet = parcs.filter((p) => p.data_vencimento === dateStr)
      if (pgtoSet.length > 0) {
        const total = pgtoSet.reduce((a, p) => a + Number(p.valor ?? 0), 0)
        events.push({
          type: "pgto",
          title: `${pgtoSet.length} pagamento${pgtoSet.length > 1 ? "s" : ""}`,
          meta: fmtBRL(total),
        })
      }
      // Marcos: obra com data_fim_prevista nesse dia
      ;(obrasRaw ?? [])
        .filter((o) => o.data_fim_prevista === dateStr)
        .forEach((o) =>
          events.push({
            type: "marco",
            title: `Entrega · ${o.nome}`,
            meta: `OBR-${String(o.id_obra).padStart(4, "0")}`,
          })
        )
      ;(obrasRaw ?? [])
        .filter((o) => o.data_inicio_prevista === dateStr)
        .forEach((o) =>
          events.push({
            type: "entrega",
            title: `Início · ${o.nome}`,
            meta: `OBR-${String(o.id_obra).padStart(4, "0")}`,
          })
        )

      const isPast = d < today && format(d, "yyyy-MM-dd") !== todayStr
      const isToday = format(d, "yyyy-MM-dd") === todayStr
      days.push({
        dow: format(d, "EEE", { locale: ptBR })
          .toUpperCase()
          .replace(".", ""),
        dom: d.getDate(),
        today: isToday,
        past: isPast,
        events,
      })
    }
    setSemana(days)

    // ---------- LANÇAMENTOS DO MÊS (saídas) ----------
    const monthStart = format(
      new Date(today.getFullYear(), today.getMonth(), 1),
      "yyyy-MM-dd"
    )
    const monthEnd = format(
      new Date(today.getFullYear(), today.getMonth() + 1, 0),
      "yyyy-MM-dd"
    )
    const { data: lancsMes } = await supabase
      .from("lancamento")
      .select("valor, id_plano_conta, entrada_saida, tipo, data_competencia")
      .gte("data_competencia", monthStart)
      .lte("data_competencia", monthEnd)
      .eq("entrada_saida", "saida")
      .eq("tipo", "realizado")

    const planoIds = Array.from(
      new Set(
        (lancsMes ?? [])
          .filter((l) => l.id_plano_conta)
          .map((l) => l.id_plano_conta!)
      )
    )
    const { data: planos } = planoIds.length
      ? await supabase
          .from("plano_conta")
          .select("id_plano, codigo, nome")
          .in("id_plano", planoIds)
      : { data: [] as { id_plano: number; codigo: string | null; nome: string }[] }
    const planoMap = new Map(
      (planos ?? []).map((p) => [
        p.id_plano,
        { codigo: p.codigo ?? "—", nome: p.nome },
      ])
    )

    const saidasMap = new Map<number, number>()
    let totalS = 0
    for (const l of lancsMes ?? []) {
      if (!l.id_plano_conta) continue
      const v = Number(l.valor)
      saidasMap.set(l.id_plano_conta, (saidasMap.get(l.id_plano_conta) ?? 0) + v)
      totalS += v
    }
    const saidas = Array.from(saidasMap.entries())
      .map(([id, valor]) => ({
        codigo: planoMap.get(id)?.codigo ?? "—",
        conta: planoMap.get(id)?.nome ?? "Outros",
        valor,
        delta: 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
    setSaidasPC(saidas)
    setSaidasTotal(totalS)

    // ---------- CURVA S CONSOLIDADA ----------
    const sixMonthsAgo = addMonths(today, -5)
    const { data: lancsCurva } = await supabase
      .from("lancamento")
      .select("valor, tipo, data_competencia")
      .eq("entrada_saida", "saida")
      .gte("data_competencia", format(sixMonthsAgo, "yyyy-MM-dd"))

    const monthMap = new Map<string, { plan: number; real: number }>()
    for (let i = 0; i < 9; i++) {
      const m = addMonths(sixMonthsAgo, i)
      const key = format(m, "yyyy-MM")
      monthMap.set(key, { plan: 0, real: 0 })
    }
    for (const l of lancsCurva ?? []) {
      const key = l.data_competencia.substring(0, 7)
      const cur = monthMap.get(key)
      if (!cur) continue
      if (l.tipo === "planejado") cur.plan += Number(l.valor)
      else if (l.tipo === "realizado") cur.real += Number(l.valor)
    }

    let accPlan = 0
    let accReal = 0
    const totalPlan = Array.from(monthMap.values()).reduce(
      (a, v) => a + v.plan,
      0
    )
    const todayKey = format(today, "yyyy-MM")
    const curvaPoints: CurvaPoint[] = Array.from(monthMap.entries()).map(
      ([key, v]) => {
        accPlan += v.plan
        accReal += v.real
        const isFuture = key > todayKey
        return {
          m: format(parseISO(key + "-01"), "MMM", { locale: ptBR }).replace(".", ""),
          plan: totalPlan > 0 ? (accPlan / totalPlan) * 100 : 0,
          real: isFuture ? null : totalPlan > 0 ? (accReal / totalPlan) * 100 : 0,
        }
      }
    )
    setCurvaS(curvaPoints)

    // ---------- FLUXO DE CAIXA SEMANAL ----------
    const fluxoData: FluxoPoint[] = []
    for (let s = 0; s < 4; s++) {
      const ws = format(addDays(weekStart, s * 7), "yyyy-MM-dd")
      const we = format(addDays(weekStart, s * 7 + 6), "yyyy-MM-dd")
      const recSemana = parcs
        .filter(
          (p) =>
            p.data_vencimento &&
            p.data_vencimento >= ws &&
            p.data_vencimento <= we
        )
        .reduce((a, p) => a + Number(p.valor ?? 0), 0)
      // Despesas: não temos vw para a pagar separado, vou usar parcelas mesmo
      fluxoData.push({
        sem: `S${s + 1}`,
        rec: 0,
        desp: recSemana,
      })
    }
    setFluxo(fluxoData)
    setReceber7d(0)
    setSaldoCaixa(0)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const ativas = obras.filter((o) => o.status === "ok").length
  const atrasadas = obras.filter((o) => o.status === "danger").length
  const pausadas = obras.filter((o) => o.status === "pausa").length

  const greet = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return "Bom dia"
    if (h < 18) return "Boa tarde"
    return "Boa noite"
  }, [])

  const now = new Date()
  const hh = String(now.getHours()).padStart(2, "0")
  const mm = String(now.getMinutes()).padStart(2, "0")
  const dow = format(now, "EEE", { locale: ptBR })
    .toUpperCase()
    .replace(".", "")
  const dom = now.getDate()
  const mes = format(now, "MMM", { locale: ptBR }).replace(".", "")
  const fullDate = format(now, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })

  const totalAtencao = atencao.length
  const criticas = atencao.filter((a) => a.tone === "danger").length

  return (
    <>
      {/* Hero */}
      <div className="dash-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="dash-hero-greet">
            {greet}, {responsavel?.nome?.split(" ")[0] ?? "—"}
          </div>
          <h1>
            Você tem{" "}
            <b>
              {criticas} ite{criticas !== 1 ? "ns" : "m"} crítico
              {criticas !== 1 ? "s" : ""}
            </b>{" "}
            e{" "}
            <b>
              {totalAtencao - criticas} pendência
              {totalAtencao - criticas !== 1 ? "s" : ""}
            </b>{" "}
            hoje.
          </h1>
          <div className="dash-hero-sub">
            {atrasadas > 0 ? (
              <>
                Há <b>{atrasadas} obra(s)</b> com atraso no cronograma.{" "}
              </>
            ) : null}
            {pagar7d > 0 ? (
              <>
                <b>{fmtBRL(pagar7d)}</b> em pagamentos para os próximos 7 dias.
              </>
            ) : (
              <>Sem pagamentos imediatos previstos.</>
            )}
          </div>
          <div className="dash-hero-actions">
            <Link href="/obras" className="btn btn-primary">
              <Icon name="alertTriangle" />
              Resolver críticos
            </Link>
            <Link href="/financeiro/contas" className="btn">
              <Icon name="receipt" />
              Contas a pagar
            </Link>
            <Link href="/obras" className="btn">
              <Icon name="plus" />
              Nova obra
            </Link>
          </div>
        </div>
        <div className="dash-hero-clock">
          <div className="day">
            {dow} · {dom} {mes}
          </div>
          <div className="time">
            {hh}:{mm}
          </div>
          <div className="date">{fullDate}</div>
        </div>
      </div>

      {/* KPIs do portfólio */}
      <div className="list-kpis cols-5" style={{ marginBottom: 18 }}>
        <div className="list-kpi tone-info">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Em andamento</div>
            <div className="kpi-icon">
              <Icon name="construction" />
            </div>
          </div>
          <div className="list-kpi-value">{ativas}</div>
          <div className="list-kpi-sub">
            <Icon name="building" />
            Canteiros ativos
          </div>
        </div>
        <div className="list-kpi tone-danger">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Com atraso</div>
            <div className="kpi-icon">
              <Icon name="alertTriangle" />
            </div>
          </div>
          <div className="list-kpi-value">{atrasadas}</div>
          <div className="list-kpi-sub">
            <Icon name="trendDown" />
            Exigem atenção
          </div>
        </div>
        <div className="list-kpi tone-success">
          <div className="list-kpi-head">
            <div className="list-kpi-label">A receber 7d</div>
            <div className="kpi-icon">
              <Icon name="arrowDown" />
            </div>
          </div>
          <div className="list-kpi-value mono">{fmtBRL(receber7d)}</div>
          <div className="list-kpi-sub">
            <Icon name="check" />
            Próximas medições
          </div>
        </div>
        <div className="list-kpi tone-warning">
          <div className="list-kpi-head">
            <div className="list-kpi-label">A pagar 7d</div>
            <div className="kpi-icon">
              <Icon name="arrowUp" />
            </div>
          </div>
          <div className="list-kpi-value mono">{fmtBRL(pagar7d)}</div>
          <div className="list-kpi-sub">
            <Icon name="receipt" />
            {boletosPend} pendente{boletosPend !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Saldo de caixa</div>
            <div className="kpi-icon">
              <Icon name="dollar" />
            </div>
          </div>
          <div className="list-kpi-value mono">{fmtBRL(saldoCaixa)}</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            Disponível
          </div>
        </div>
      </div>

      {/* Atalhos rápidos */}
      <div className="quick-actions">
        <Link href="/obras" className="quick-action">
          <div className="quick-action-icon">
            <Icon name="fileText" />
          </div>
          <div className="quick-action-text">
            <div className="ttl">Novo diário de obra</div>
            <div className="sub">Registrar o dia</div>
          </div>
        </Link>
        <Link href="/financeiro/lancamentos" className="quick-action">
          <div className="quick-action-icon">
            <Icon name="dollar" />
          </div>
          <div className="quick-action-text">
            <div className="ttl">Lançar despesa</div>
            <div className="sub">NF-e ou boleto</div>
          </div>
        </Link>
        <Link href="/dashboards/alocacao" className="quick-action">
          <div className="quick-action-icon">
            <Icon name="users" />
          </div>
          <div className="quick-action-text">
            <div className="ttl">Escala da semana</div>
            <div className="sub">Alocar trabalhadores</div>
          </div>
        </Link>
        <Link href="/obras" className="quick-action">
          <div className="quick-action-icon">
            <Icon name="plus" />
          </div>
          <div className="quick-action-text">
            <div className="ttl">Nova obra</div>
            <div className="sub">Cadastrar projeto</div>
          </div>
        </Link>
      </div>

      <div className="dash-grid">
        {/* Coluna esquerda */}
        <div className="dash-col-left">
          {/* Atenção agora */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div>
                <div className="eyebrow">Atenção agora</div>
                <h2>{totalAtencao} itens precisam de você</h2>
              </div>
              <div className="actions">
                <Link href="/obras">
                  Ver tudo <Icon name="arrowRight" />
                </Link>
              </div>
            </div>
            <div className="attn-list">
              {totalAtencao === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Tudo certo! Nenhum item crítico no momento.
                </div>
              ) : (
                atencao.map((a) => (
                  <div className="attn-item" key={a.id}>
                    <div className={"attn-icon " + a.tone}>
                      <Icon name={a.icon} />
                    </div>
                    <div className="attn-body">
                      <div className="attn-title">{a.title}</div>
                      <div className="attn-meta">
                        {a.meta.map((m, i) =>
                          typeof m === "string" ? (
                            <span key={i}>
                              {i > 0 ? (
                                <span style={{ opacity: 0.4, marginRight: 4 }}>
                                  ·
                                </span>
                              ) : null}
                              {m}
                            </span>
                          ) : (
                            <span
                              key={i}
                              className={
                                "pill" +
                                (m.type === "pill-danger" ? " danger" : "")
                              }
                            >
                              {m.text}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    <div className="attn-action">
                      {a.actions.map((act, i) =>
                        act.href ? (
                          <Link
                            key={i}
                            href={act.href}
                            className={
                              "btn-mini" +
                              (act.primary ? " primary" : "") +
                              (act.danger ? " danger" : "")
                            }
                          >
                            {act.label}
                          </Link>
                        ) : (
                          <button
                            key={i}
                            type="button"
                            className={
                              "btn-mini" +
                              (act.primary ? " primary" : "") +
                              (act.danger ? " danger" : "")
                            }
                          >
                            {act.label}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Esta semana */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div>
                <div className="eyebrow">Agenda</div>
                <h2>
                  Esta semana ·{" "}
                  {format(
                    startOfWeek(now, { weekStartsOn: 1 }),
                    "dd MMM",
                    { locale: ptBR }
                  )}{" "}
                  —{" "}
                  {format(
                    endOfWeek(now, { weekStartsOn: 1 }),
                    "dd MMM",
                    { locale: ptBR }
                  )}
                </h2>
              </div>
            </div>
            <div className="week-grid">
              {semana.map((d, i) => (
                <div
                  key={i}
                  className={
                    "week-day" +
                    (d.today ? " today" : "") +
                    (d.past ? " past" : "")
                  }
                >
                  <div className="week-day-head">
                    <span className="dow">{d.dow}</span>
                    <span className="dom">{d.dom}</span>
                  </div>
                  {d.events.map((ev, j) => (
                    <div key={j} className={"week-event " + ev.type}>
                      <div className="ev-title">{ev.title}</div>
                      <div className="ev-meta">{ev.meta}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Saídas por plano de contas */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div>
                <div className="eyebrow">
                  Financeiro · {format(now, "MMM/yy", { locale: ptBR })}
                </div>
                <h2>Saídas por plano de contas · {fmtBRL(saidasTotal)}</h2>
              </div>
              <div className="actions">
                <Link href="/financeiro/plano-contas">
                  Ver detalhamento <Icon name="arrowRight" />
                </Link>
              </div>
            </div>
            <div className="pc-list">
              {saidasPC.length === 0 ? (
                <div
                  style={{
                    padding: "32px 24px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Nenhuma saída registrada no mês.
                </div>
              ) : (
                saidasPC.map((p) => {
                  const maxVal = saidasPC[0]?.valor || 1
                  const pct = (p.valor / maxVal) * 100
                  const sharePct =
                    saidasTotal > 0
                      ? Math.round((p.valor / saidasTotal) * 100)
                      : 0
                  return (
                    <div className="pc-row" key={p.codigo + p.conta}>
                      <div className="pc-row-head">
                        <div className="pc-row-name">
                          <span className="pc-codigo mono">{p.codigo}</span>
                          <span>{p.conta}</span>
                        </div>
                        <div className="pc-row-val">
                          <span className="pc-valor mono">
                            {fmtBRL(p.valor)}
                          </span>
                          <span className="pc-share">{sharePct}%</span>
                        </div>
                      </div>
                      <div className="pc-bar">
                        <div
                          className="pc-bar-fill"
                          style={{ width: pct + "%" }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="dash-col-right">
          {/* Obras ativas */}
          <div className="dash-card dash-card-obras">
            <div className="dash-card-head">
              <div>
                <div className="eyebrow">Portfólio</div>
                <h2>Obras ativas · {obras.length}</h2>
              </div>
              <div className="actions">
                <Link href="/obras">
                  Ver todas <Icon name="arrowRight" />
                </Link>
              </div>
            </div>
            <div className="dash-obras">
              {obras.length === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Nenhuma obra cadastrada.
                </div>
              ) : (
                obras.map((o) => <MiniObraCard key={o.id} o={o} />)
              )}
            </div>
          </div>

          {/* Curva S mini */}
          <div className="mini-chart-card">
            <div className="eyebrow">Execução do portfólio</div>
            <h3>Curva S consolidada</h3>
            <CurvaSMini data={curvaS} />
            <div className="mini-chart-foot">
              <div className="legend">
                <span>
                  <i style={{ background: "var(--info)" }} />
                  Planejado
                </span>
                <span>
                  <i style={{ background: "var(--success)" }} />
                  Realizado
                </span>
              </div>
            </div>
          </div>

          {/* Fluxo de caixa mini */}
          <div className="mini-chart-card">
            <div className="eyebrow">Próximos 30 dias</div>
            <h3>Fluxo de caixa semanal</h3>
            <FluxoMini data={fluxo} />
            <div className="mini-chart-foot">
              <div className="legend">
                <span>
                  <i style={{ background: "var(--success)" }} />
                  Receitas
                </span>
                <span>
                  <i style={{ background: "var(--danger)" }} />
                  Despesas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
