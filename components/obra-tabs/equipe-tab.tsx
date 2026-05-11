"use client"

// Port literal de granum-design/tab-equipe.jsx

import { useCallback, useEffect, useMemo, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface Trabalhador {
  id_trabalhador: number
  nome: string
  especialidade: string | null
  id_contrato: number
  valor_acordado: number
  vinculo: string
}
interface Escala {
  id_escala: number
  id_trabalhador: number
  data_prevista: string
  turno: string
  status: string
}

const CELL_STYLE: Record<
  string,
  { bg: string; fg: string; border: string; label: string; title: string }
> = {
  c: {
    bg: "var(--success-soft)",
    fg: "var(--success)",
    border: "var(--success)",
    label: "✓",
    title: "Presente / confirmado",
  },
  p: {
    bg: "transparent",
    fg: "var(--info)",
    border: "var(--info-soft)",
    label: "●",
    title: "Escalado / planejado",
  },
  f: {
    bg: "var(--danger)",
    fg: "var(--danger-on, #fff)",
    border: "var(--danger)",
    label: "F",
    title: "Falta não justificada",
  },
  m: {
    bg: "var(--warning-soft)",
    fg: "var(--warning-ink)",
    border: "var(--warning)",
    label: "½",
    title: "Meio turno",
  },
  j: {
    bg: "var(--warning-soft)",
    fg: "var(--warning-ink)",
    border: "var(--warning-soft)",
    label: "J",
    title: "Falta justificada",
  },
  "": {
    bg: "transparent",
    fg: "var(--ink-soft)",
    border: "transparent",
    label: "—",
    title: "Folga",
  },
}

function fmtBRL(v: number): string {
  if (!v) return "R$ 0"
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000) return "R$ " + Math.round(v / 1000) + " mil"
  return "R$ " + v
}

interface EquipeTabProps {
  obraId: number
}

export function EquipeTab({ obraId }: EquipeTabProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([])
  const [escalas, setEscalas] = useState<Escala[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const dias = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = addDays(weekStart, i)
        return {
          lbl: format(d, "EEE", { locale: ptBR }).replace(".", ""),
          num: format(d, "dd"),
          hoje: format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
          date: format(d, "yyyy-MM-dd"),
        }
      }),
    [weekStart]
  )

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: cts } = await supabase
      .from("contrato_trabalho")
      .select("id_contrato, id_trabalhador, valor_acordado, tipo_pagamento")
      .eq("id_obra", obraId)
      .eq("status", "ativo")
    const ctList = (cts ?? []) as {
      id_contrato: number
      id_trabalhador: number
      valor_acordado: number
      tipo_pagamento: string
    }[]

    if (ctList.length === 0) {
      setTrabalhadores([])
      setEscalas([])
      setIsLoading(false)
      return
    }

    const trabIds = Array.from(new Set(ctList.map((c) => c.id_trabalhador)))
    const { data: trabs } = await supabase
      .from("trabalhador")
      .select("id_trabalhador, nome, especialidade, tipo_vinculo")
      .in("id_trabalhador", trabIds)
    setTrabalhadores(
      ((trabs ?? []) as {
        id_trabalhador: number
        nome: string
        especialidade: string | null
        tipo_vinculo: string | null
      }[]).map((t) => {
        const ct = ctList.find((c) => c.id_trabalhador === t.id_trabalhador)!
        return {
          ...t,
          vinculo: t.tipo_vinculo ?? ct.tipo_pagamento ?? "diaria",
          id_contrato: ct.id_contrato,
          valor_acordado: ct.valor_acordado,
        }
      })
    )

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

  function getEscala(trabId: number, day: string): Escala | undefined {
    return escalas.find(
      (e) => e.id_trabalhador === trabId && e.data_prevista === day
    )
  }

  function dayStatus(trabId: number, day: string): keyof typeof CELL_STYLE {
    const e = getEscala(trabId, day)
    if (!e) return ""
    if (e.status === "cancelado") return ""
    if (e.status === "confirmado") return "c"
    return "p"
  }

  async function toggleEscala(trab: Trabalhador, day: string) {
    const supabase = createClient()
    const existing = getEscala(trab.id_trabalhador, day)
    if (existing) {
      await supabase
        .from("escala")
        .update({
          status: existing.status === "cancelado" ? "planejado" : "cancelado",
        })
        .eq("id_escala", existing.id_escala)
    } else {
      const { error } = await supabase.from("escala").insert({
        id_obra: obraId,
        id_trabalhador: trab.id_trabalhador,
        id_contrato: trab.id_contrato,
        data_prevista: day,
        turno: "integral",
        status: "planejado",
      })
      if (error) {
        toast.error("Erro: " + error.message)
        return
      }
    }
    load()
  }

  const totalPresencas = trabalhadores.reduce(
    (s, t) =>
      s + dias.filter((d) => dayStatus(t.id_trabalhador, d.date) === "c").length,
    0
  )
  const totalPlanejadas = trabalhadores.reduce(
    (s, t) =>
      s + dias.filter((d) => dayStatus(t.id_trabalhador, d.date) === "p").length,
    0
  )
  const dayTotals = dias.map((d) =>
    trabalhadores.reduce((sum, t) => {
      const s = dayStatus(t.id_trabalhador, d.date)
      if (s === "c" || s === "p") return sum + t.valor_acordado
      return sum
    }, 0)
  )
  const weekTotal = dayTotals.reduce((a, v) => a + v, 0)

  return (
    <>
      {/* Controls + navegação */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div
          className="card-body"
          style={{
            padding: 14,
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="icon-btn"
            style={{ border: "1px solid var(--line-strong)" }}
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <Icon name="chevronLeft" />
          </button>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {format(weekStart, "dd/MM", { locale: ptBR })} —{" "}
              {format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
              {trabalhadores.length} trabalhador
              {trabalhadores.length !== 1 ? "es" : ""} com contrato ativo
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            style={{ border: "1px solid var(--line-strong)" }}
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <Icon name="chevronRight" />
          </button>

          <div
            style={{
              width: 1,
              height: 32,
              background: "var(--line)",
              marginLeft: 8,
              marginRight: 4,
            }}
          />

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              fontSize: 11.5,
              color: "var(--ink-muted)",
              flexWrap: "wrap",
            }}
          >
            {[
              { k: "c", l: "Presente" },
              { k: "p", l: "Escalado" },
              { k: "j", l: "Justificada" },
              { k: "f", l: "Falta" },
            ].map(({ k, l }) => {
              const s = CELL_STYLE[k]
              return (
                <span
                  key={k}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 20,
                      borderRadius: 4,
                      background: s.bg,
                      color: s.fg,
                      border: "1px solid " + s.border,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10.5,
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </span>
                  {l}
                </span>
              )
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginLeft: "auto" }}
            disabled
          >
            <Icon name="download" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div
        className="list-kpis"
        style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 14 }}
      >
        <div className="list-kpi tone-success">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Presenças confirmadas</div>
            <div className="kpi-icon">
              <Icon name="check" />
            </div>
          </div>
          <div className="list-kpi-value">{totalPresencas}</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            Dias passados
          </div>
        </div>
        <div className="list-kpi tone-info">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Dias escalados</div>
            <div className="kpi-icon">
              <Icon name="calendar" />
            </div>
          </div>
          <div className="list-kpi-value">{totalPlanejadas}</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />A confirmar
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Custo previsto</div>
          <div className="list-kpi-value mono fin-neg">
            {fmtBRL(weekTotal)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="dollar" />
            Total da semana
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Trabalhadores ativos</div>
          <div className="list-kpi-value">{trabalhadores.length}</div>
          <div className="list-kpi-sub">
            <Icon name="users" />
            Com contrato em vigor
          </div>
        </div>
      </div>

      {/* Grid de escala */}
      <div className="card">
        <div className="card-head">
          <h3>
            <Icon name="users" />
            Escala semanal
          </h3>
          <div
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div
              style={{ fontSize: 11.5, color: "var(--ink-muted)" }}
            >
              Custo previsto da semana
            </div>
            <div
              className="mono"
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "var(--danger)",
              }}
            >
              {fmtBRL(weekTotal)}
            </div>
          </div>
        </div>
        {isLoading ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: "var(--ink-muted)",
              fontSize: 13.5,
            }}
          >
            Carregando…
          </div>
        ) : trabalhadores.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: "var(--ink-muted)",
              fontSize: 13.5,
            }}
          >
            Nenhum trabalhador com contrato ativo nesta obra.
          </div>
        ) : (
          <div className="escala-grid">
            <div className="escala-head">
              <div className="escala-cell-trab">Trabalhador</div>
              {dias.map((d, i) => (
                <div
                  key={i}
                  className={"escala-cell-day" + (d.hoje ? " hoje" : "")}
                >
                  <div className="dia">{d.lbl}</div>
                  <div className="num">{d.num}</div>
                </div>
              ))}
              <div className="escala-cell-total">Semana</div>
            </div>
            {trabalhadores.map((t) => {
              const wk = dias.reduce((s, d) => {
                const st = dayStatus(t.id_trabalhador, d.date)
                if (st === "c" || st === "p") return s + t.valor_acordado
                return s
              }, 0)
              return (
                <div className="escala-row" key={t.id_trabalhador}>
                  <div className="escala-cell-trab">
                    <div className="nm">{t.nome}</div>
                    <div className="sub">
                      {t.especialidade ?? "—"} ·{" "}
                      <span className="mono">{fmtBRL(t.valor_acordado)}</span>
                      /dia
                    </div>
                  </div>
                  {dias.map((d, i) => {
                    const status = dayStatus(t.id_trabalhador, d.date)
                    const s = CELL_STYLE[status]
                    return (
                      <button
                        key={i}
                        type="button"
                        title={s.title}
                        onClick={() => toggleEscala(t, d.date)}
                        className="escala-cell-day"
                        style={{
                          background: s.bg,
                          color: s.fg,
                          border: "1px solid " + s.border,
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {s.label}
                      </button>
                    )
                  })}
                  <div
                    className="escala-cell-total mono"
                    style={{ color: "var(--danger)" }}
                  >
                    {fmtBRL(wk)}
                  </div>
                </div>
              )
            })}
            <div className="escala-row escala-totals">
              <div className="escala-cell-trab">
                <strong>Total do dia</strong>
              </div>
              {dayTotals.map((v, i) => (
                <div key={i} className="escala-cell-day mono fin-neg">
                  {fmtBRL(v)}
                </div>
              ))}
              <div
                className="escala-cell-total mono fin-neg"
                style={{ fontWeight: 600 }}
              >
                {fmtBRL(weekTotal)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
