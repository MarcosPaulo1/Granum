"use client"

// Port literal de granum-design/alocacao-equipe-app.jsx + AlocacaoEquipe.html

import { useCallback, useEffect, useMemo, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface AlocRow {
  id: string
  rawId: number
  nome: string
  esp: string
  obra: string
  val: number
  dias: ("" | "p" | "e" | "f" | "j")[]
}

const STATUS = {
  p: {
    bg: "var(--success-soft)",
    color: "var(--success-ink)",
    label: "Presente",
    icon: "✓",
  },
  e: {
    bg: "var(--info-soft)",
    color: "var(--info-ink)",
    label: "Escalado",
    icon: "·",
  },
  f: {
    bg: "var(--danger-soft)",
    color: "var(--danger-ink)",
    label: "Falta",
    icon: "✕",
  },
  j: {
    bg: "var(--warning-soft)",
    color: "var(--warning-ink)",
    label: "Justif.",
    icon: "!",
  },
} as const

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtBRL(v: number): string {
  return "R$ " + v.toLocaleString("pt-BR")
}

export default function AlocacaoPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [rows, setRows] = useState<AlocRow[]>([])
  const [, setIsLoading] = useState(true)
  const [fObra, setFObra] = useState<"todas" | string>("todas")
  const [fEsp, setFEsp] = useState<"todas" | string>("todas")

  const days = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )
  const DIAS = days.map(
    (d) =>
      `${format(d, "EEE", { locale: ptBR }).replace(".", "")} ${format(d, "dd/MM")}`
  )

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const start = format(weekStart, "yyyy-MM-dd")
    const end = format(addDays(weekStart, 5), "yyyy-MM-dd")

    const { data: alocacoes } = await supabase
      .from("vw_alocacao_diaria")
      .select("*")
      .gte("data_prevista", start)
      .lte("data_prevista", end)

    const map = new Map<string, AlocRow>()

    for (const a of alocacoes ?? []) {
      const idStr = `${a.id_trabalhador}-${a.id_obra}`
      let row = map.get(idStr)
      if (!row) {
        row = {
          id: idStr,
          rawId: a.id_trabalhador ?? 0,
          nome: a.trabalhador ?? "",
          esp: a.especialidade ?? "",
          obra: a.obra ?? "",
          val: 0,
          dias: Array.from({ length: 6 }, () => "" as const),
        }
        map.set(idStr, row)
      }
      const dayIdx = days.findIndex(
        (d) => format(d, "yyyy-MM-dd") === a.data_prevista
      )
      if (dayIdx === -1) continue
      const sit = a.situacao
      if (sit === "presente") row.dias[dayIdx] = "p"
      else if (sit === "futuro") row.dias[dayIdx] = "e"
      else if (sit === "ausente") row.dias[dayIdx] = "f"
    }

    setRows(
      Array.from(map.values()).sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      )
    )
    setIsLoading(false)
  }, [weekStart, days])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () => Array.from(new Set(rows.map((t) => t.obra).filter(Boolean))).sort(),
    [rows]
  )
  const esps = useMemo(
    () => Array.from(new Set(rows.map((t) => t.esp).filter(Boolean))).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter(
        (t) =>
          (fObra === "todas" || t.obra === fObra) &&
          (fEsp === "todas" || t.esp === fEsp)
      ),
    [rows, fObra, fEsp]
  )

  const totais = days.map((_, i) => {
    const p = filtered.filter((t) => t.dias[i] === "p")
    const e = filtered.filter((t) => t.dias[i] === "e")
    const f = filtered.filter((t) => t.dias[i] === "f")
    const custo = p.reduce((a, t) => a + t.val, 0)
    return {
      presentes: p.length,
      escalados: e.length,
      faltas: f.length,
      custo,
    }
  })

  const totalSemana = totais.reduce((a, d) => a + d.custo, 0)
  const presencasTotal = filtered.reduce(
    (a, t) => a + t.dias.filter((d) => d === "p").length,
    0
  )
  const faltasTotal = filtered.reduce(
    (a, t) => a + t.dias.filter((d) => d === "f").length,
    0
  )
  const diasRealizados = 3
  const diasPossiveis = filtered.length * diasRealizados
  const taxaPresenca = diasPossiveis
    ? (presencasTotal / diasPossiveis) * 100
    : 0

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">
              Relatórios · Semana de{" "}
              {format(weekStart, "dd/MM", { locale: ptBR })} a{" "}
              {format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <h1>Alocação de equipe</h1>
            <div className="subtitle">
              {filtered.length} trabalhadores em {obras.length} obra
              {obras.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="download" />
              Exportar
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
            >
              <Icon name="chevronLeft" />
              Semana anterior
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
            >
              Próxima
              <Icon name="chevronRight" />
            </button>
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi tone-success">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Taxa de presença</div>
            <div className="kpi-icon">
              <Icon name="check" />
            </div>
          </div>
          <div className="list-kpi-value">{taxaPresenca.toFixed(1)}%</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            {presencasTotal} presenças em {diasPossiveis} dias possíveis
          </div>
        </div>
        <div className="list-kpi tone-danger">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Faltas na semana</div>
            <div className="kpi-icon">
              <Icon name="x" />
            </div>
          </div>
          <div className="list-kpi-value fin-neg">{faltasTotal}</div>
          <div className="list-kpi-sub">
            <Icon name="alertTriangle" />
            Sem justificativa
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Custo semanal estimado</div>
          <div className="list-kpi-value fin-neg mono">
            {fmtBRL(totalSemana)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="dollar" />
            {filtered.length} trabalhadores · base diária
          </div>
        </div>
        <div className="list-kpi tone-warning">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Alertas de escalação</div>
            <div className="kpi-icon">
              <Icon name="alertTriangle" />
            </div>
          </div>
          <div className="list-kpi-value">0</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            Sem alertas no momento
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              fontSize: 12,
              color: "var(--ink-muted)",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>
              Legenda:
            </span>
            {Object.entries(STATUS).map(([k, s]) => (
              <span
                key={k}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: s.bg,
                    color: s.color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {s.icon}
                </span>
                {s.label}
              </span>
            ))}
          </div>
          <div className="list-filters">
            <select
              className="seg-select"
              value={fObra}
              onChange={(e) => setFObra(e.target.value)}
            >
              <option value="todas">Todas as obras</option>
              {obras.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <select
              className="seg-select"
              value={fEsp}
              onChange={(e) => setFEsp(e.target.value)}
            >
              <option value="todas">Todas as especialidades</option>
              {esps.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="aloc-matrix">
          <div className="aloc-thead">
            <div className="aloc-nome">Trabalhador</div>
            {DIAS.map((d) => (
              <div key={d} className="aloc-day">
                {d}
              </div>
            ))}
            <div className="aloc-total">Dias / Custo</div>
          </div>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--ink-muted)",
                fontSize: 13.5,
              }}
            >
              Nenhuma alocação na semana.
            </div>
          ) : (
            <>
              {filtered.map((t) => {
                const pres = t.dias.filter((d) => d === "p").length
                const esc = t.dias.filter((d) => d === "e").length
                const custo = (pres + esc) * t.val
                return (
                  <div className="aloc-row" key={t.id}>
                    <div className="aloc-nome-cell">
                      <span className="avatar-sm">{getInitials(t.nome)}</span>
                      <div>
                        <div className="nm">{t.nome}</div>
                        <div className="sub">
                          {t.esp} · {t.obra}
                        </div>
                      </div>
                    </div>
                    {t.dias.map((d, i) => {
                      if (!d) return <div key={i} className="aloc-cell aloc-empty" />
                      const s = STATUS[d]
                      return (
                        <div
                          key={i}
                          className="aloc-cell"
                          style={{ background: s.bg, color: s.color }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700 }}>
                            {s.icon}
                          </span>
                        </div>
                      )
                    })}
                    <div className="aloc-total-cell">
                      <div
                        className="mono"
                        style={{ fontSize: 13, fontWeight: 500 }}
                      >
                        {pres + esc}/6
                      </div>
                      <div className="sub fin-neg mono">{fmtBRL(custo)}</div>
                    </div>
                  </div>
                )
              })}
              <div className="aloc-row aloc-totals">
                <div
                  className="aloc-nome-cell"
                  style={{ fontWeight: 600 }}
                >
                  Totais do dia
                </div>
                {totais.map((t, i) => (
                  <div key={i} className="aloc-cell-tot">
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {t.presentes + t.escalados}
                    </div>
                    <div
                      className="mono fin-neg"
                      style={{ fontSize: 10.5 }}
                    >
                      {t.custo > 0
                        ? "R$ " + (t.custo / 1000).toFixed(1) + "k"
                        : "—"}
                    </div>
                  </div>
                ))}
                <div className="aloc-total-cell">
                  <div
                    className="mono fin-neg"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    {fmtBRL(totalSemana)}
                  </div>
                  <div className="sub">Custo da semana</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
