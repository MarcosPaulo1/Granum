"use client"

// Port literal de granum-design/folha-semanal-app.jsx + FolhaSemanal.html

import { useCallback, useEffect, useMemo, useState } from "react"
import { addDays, eachDayOfInterval, format, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface FolhaRow {
  id: string
  rawId: number
  nome: string
  init: string
  esp: string
  obra: string
  id_obra: number
  vinculo: "diaria" | "empreitada" | "mensal"
  valor: number
  dias: number[]
  diasValor: number[]
  pix: string
  status: "pago" | "pronto" | "agendado" | "aberto"
  obs?: string
}

const VINC_BADGE: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  diaria: {
    label: "Diária",
    bg: "var(--info-soft)",
    fg: "var(--info-ink)",
  },
  empreitada: {
    label: "Empreitada",
    bg: "var(--warning-soft)",
    fg: "var(--warning-ink)",
  },
  mensal: {
    label: "Mensal",
    bg: "var(--success-soft)",
    fg: "var(--success-ink)",
  },
}

const STATUS_META: Record<string, { cls: string; label: string }> = {
  pago: { cls: "badge-success", label: "Pago" },
  pronto: { cls: "badge-info", label: "Pronto p/ pagar" },
  agendado: { cls: "badge-warning", label: "Agendado" },
  aberto: { cls: "badge-neutral", label: "Em aberto" },
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtBRL(v: number): string {
  return (
    "R$ " +
    v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

function fmtBRLk(v: number): string {
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000)
    return "R$ " + Math.round(v / 1000).toLocaleString("pt-BR") + " mil"
  return "R$ " + v
}

function VincBadge({ v }: { v: FolhaRow["vinculo"] }) {
  const m = VINC_BADGE[v] ?? VINC_BADGE.diaria
  return (
    <span
      className="tipo-tag"
      style={{ background: m.bg, color: m.fg, fontWeight: 500, fontSize: 11 }}
    >
      {m.label}
    </span>
  )
}

function StatusBadge({ s }: { s: FolhaRow["status"] }) {
  const m = STATUS_META[s] ?? STATUS_META.aberto
  return <span className={"badge dot " + m.cls}>{m.label}</span>
}

function totalSemana(t: FolhaRow): number {
  return t.diasValor.reduce((a, v) => a + v, 0)
}

export default function FolhaPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [rows, setRows] = useState<FolhaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fObra, setFObra] = useState<"todas" | string>("todas")
  const [fStatus, setFStatus] = useState<"todos" | FolhaRow["status"]>(
    "todos"
  )
  const [busca, setBusca] = useState("")
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [gerando, setGerando] = useState(false)

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 5) }),
    [weekStart]
  )
  const DIAS = days.map((d) => format(d, "EEE dd", { locale: ptBR }))

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const start = format(weekStart, "yyyy-MM-dd")
    const end = format(addDays(weekStart, 5), "yyyy-MM-dd")

    const { data: diarios } = await supabase
      .from("diario_obra")
      .select("id_diario, data, id_obra")
      .gte("data", start)
      .lte("data", end)

    if (!diarios || diarios.length === 0) {
      setRows([])
      setIsLoading(false)
      return
    }

    const diarioMap = new Map(
      diarios.map((d) => [
        d.id_diario,
        { data: d.data as string, id_obra: d.id_obra },
      ])
    )

    const { data: presencas } = await supabase
      .from("presenca")
      .select("id_trabalhador, id_diario, valor_dia, tipo_presenca")
      .in("id_diario", Array.from(diarioMap.keys()))

    if (!presencas || presencas.length === 0) {
      setRows([])
      setIsLoading(false)
      return
    }

    const trabIds = Array.from(new Set(presencas.map((p) => p.id_trabalhador)))
    const obraIds = Array.from(
      new Set(Array.from(diarioMap.values()).map((d) => d.id_obra))
    )

    const [{ data: trabs }, { data: obras }] = await Promise.all([
      supabase
        .from("trabalhador")
        .select(
          "id_trabalhador, nome, especialidade, tipo_vinculo, pix_chave"
        )
        .in("id_trabalhador", trabIds),
      supabase.from("obra").select("id_obra, nome").in("id_obra", obraIds),
    ])

    const trabMap = new Map((trabs ?? []).map((t) => [t.id_trabalhador, t]))
    const obraMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.nome as string])
    )

    const rowsMap = new Map<string, FolhaRow>()
    for (const p of presencas) {
      const di = diarioMap.get(p.id_diario)
      if (!di) continue
      const t = trabMap.get(p.id_trabalhador)
      if (!t) continue
      const key = `${p.id_trabalhador}-${di.id_obra}`
      let row = rowsMap.get(key)
      if (!row) {
        const vinc =
          t.tipo_vinculo === "diaria" ||
          t.tipo_vinculo === "autonomo"
            ? "diaria"
            : t.tipo_vinculo === "empreiteiro"
              ? "empreitada"
              : t.tipo_vinculo === "clt" || t.tipo_vinculo === "mensal"
                ? "mensal"
                : "diaria"
        row = {
          id: key,
          rawId: p.id_trabalhador,
          nome: t.nome,
          init: getInitials(t.nome),
          esp: t.especialidade ?? "",
          obra: obraMap.get(di.id_obra) ?? "",
          id_obra: di.id_obra,
          vinculo: vinc as FolhaRow["vinculo"],
          valor: 0,
          dias: Array.from({ length: 6 }, () => 0),
          diasValor: Array.from({ length: 6 }, () => 0),
          pix: t.pix_chave ?? "",
          status: "aberto",
        }
        rowsMap.set(key, row)
      }
      const dayIdx = days.findIndex(
        (d) => format(d, "yyyy-MM-dd") === di.data
      )
      if (dayIdx === -1) continue
      const valor = Number(p.valor_dia ?? 0)
      row.dias[dayIdx] = 1
      row.diasValor[dayIdx] = valor
      if (valor > row.valor) row.valor = valor
    }

    setRows(
      Array.from(rowsMap.values()).sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      )
    )
    setIsLoading(false)
  }, [weekStart, days])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () => Array.from(new Set(rows.map((r) => r.obra).filter(Boolean))).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((t) => {
        if (fObra !== "todas" && t.obra !== fObra) return false
        if (fStatus !== "todos" && t.status !== fStatus) return false
        if (
          busca &&
          !(t.nome + t.esp).toLowerCase().includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [rows, fObra, fStatus, busca]
  )

  const totalPago = rows
    .filter((t) => t.status === "pago")
    .reduce((a, t) => a + totalSemana(t), 0)
  const totalPronto = rows
    .filter((t) => t.status === "pronto" || t.status === "agendado")
    .reduce((a, t) => a + totalSemana(t), 0)
  const totalAberto = rows
    .filter((t) => t.status === "aberto")
    .reduce((a, t) => a + totalSemana(t), 0)
  const totalSem = rows.reduce((a, t) => a + totalSemana(t), 0)
  const totalPresencas = rows.reduce(
    (a, t) => a + t.dias.reduce((b, d) => b + d, 0),
    0
  )

  const toggle = (id: string) => {
    setSel((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  const totalSel = rows
    .filter((t) => sel.has(t.id))
    .reduce((a, t) => a + totalSemana(t), 0)

  const totPorDia = days.map((_, di) =>
    filtered
      .filter((t) => t.vinculo === "diaria")
      .reduce((a, t) => a + t.diasValor[di], 0)
  )

  async function gerarLancamentos() {
    if (filtered.length === 0) {
      toast.error("Nenhuma folha para gerar")
      return
    }
    setGerando(true)
    const supabase = createClient()
    const obraIds = Array.from(new Set(filtered.map((r) => r.id_obra)))
    const { data: obras } = await supabase
      .from("obra")
      .select("id_obra, id_centro_custo")
      .in("id_obra", obraIds)
    const ccMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.id_centro_custo])
    )
    let count = 0
    for (const row of filtered) {
      const total = totalSemana(row)
      if (total <= 0) continue
      const cc = ccMap.get(row.id_obra)
      if (!cc) continue
      const { error } = await supabase.from("lancamento").insert({
        id_obra: row.id_obra,
        id_centro_custo: cc,
        id_responsavel: 1,
        valor: total,
        tipo: "realizado",
        entrada_saida: "saida",
        data_competencia: format(weekStart, "yyyy-MM-dd"),
        historico: `Folha semanal — ${row.nome}`,
      })
      if (!error) count++
    }
    setGerando(false)
    toast.success(`${count} lançamentos gerados`)
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">
              Financeiro · Semana de{" "}
              {format(weekStart, "dd/MM", { locale: ptBR })} a{" "}
              {format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            <h1>Folha semanal</h1>
            <div className="subtitle">
              {rows.length} trabalhadores · {totalPresencas} presenças
              registradas
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="download" />
              Exportar folha
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
              Próxima semana
              <Icon name="chevronRight" />
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={gerarLancamentos}
              disabled={gerando}
            >
              <Icon name="check" />
              {gerando ? "Gerando…" : "Fechar e pagar"}
            </button>
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi">
          <div className="list-kpi-label">Total da semana</div>
          <div className="list-kpi-value fin-neg">{fmtBRLk(totalSem)}</div>
          <div className="list-kpi-sub">
            <Icon name="dollar" />
            {rows.length} trabalhadores ativos
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Já pago</div>
          <div className="list-kpi-value fin-pos">{fmtBRLk(totalPago)}</div>
          <div className="list-kpi-sub">
            <Icon name="check" />
            {rows.filter((t) => t.status === "pago").length} confirmados
          </div>
        </div>
        <div className="list-kpi tone-warning">
          <div className="list-kpi-head">
            <div className="list-kpi-label">A pagar</div>
            <div className="kpi-icon">
              <Icon name="clock" />
            </div>
          </div>
          <div className="list-kpi-value">
            {fmtBRLk(totalPronto + totalAberto)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="clock" />
            Pronto: {fmtBRLk(totalPronto)} · Aberto: {fmtBRLk(totalAberto)}
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Custo médio dia</div>
          <div className="list-kpi-value">
            {fmtBRLk(Math.round(totalSem / 6))}
          </div>
          <div className="list-kpi-sub">
            <Icon name="activity" />6 dias úteis
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar trabalhador ou especialidade…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
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
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "aberto", label: "Em aberto" },
                  { id: "pronto", label: "Prontos" },
                  { id: "pago", label: "Pagos" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"seg-btn" + (fStatus === t.id ? " active" : "")}
                  onClick={() => setFStatus(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sel.size > 0 ? (
          <div className="bulk-bar">
            <div>
              <strong>{sel.size}</strong> selecionado{sel.size > 1 ? "s" : ""} ·{" "}
              <span
                className="mono"
                style={{ fontWeight: 500, color: "var(--ink)" }}
              >
                {fmtBRL(totalSel)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSel(new Set())}
              >
                Cancelar
              </button>
              <button className="btn btn-secondary" type="button" disabled>
                <Icon name="download" />
                Remessa PIX
              </button>
              <button className="btn btn-primary" type="button" disabled>
                <Icon name="check" />
                Marcar como pagos
              </button>
            </div>
          </div>
        ) : null}

        <div className="folha-table">
          <div className="folha-thead">
            <div className="folha-sel"></div>
            <div className="folha-nome">Trabalhador</div>
            <div className="folha-vinc">Vínculo · Obra</div>
            {DIAS.map((d, i) => (
              <div key={i} className="folha-day">
                {d}
              </div>
            ))}
            <div className="folha-total">Total</div>
            <div className="folha-status">Status</div>
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
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--ink-muted)",
                fontSize: 13.5,
              }}
            >
              Nenhum registro de presença.
            </div>
          ) : (
            <>
              {filtered.map((t) => {
                const tot = totalSemana(t)
                const presencas = t.dias.reduce((a, d) => a + d, 0)
                return (
                  <div
                    className={"folha-row" + (sel.has(t.id) ? " row-selected" : "")}
                    key={t.id}
                  >
                    <div className="folha-sel">
                      {t.status !== "pago" ? (
                        <input
                          type="checkbox"
                          checked={sel.has(t.id)}
                          onChange={() => toggle(t.id)}
                          className="list-check"
                        />
                      ) : null}
                    </div>
                    <div className="folha-nome-cell">
                      <span className="avatar-sm">{t.init}</span>
                      <div>
                        <div className="nm">{t.nome}</div>
                        <div className="sub">{t.esp}</div>
                      </div>
                    </div>
                    <div>
                      <VincBadge v={t.vinculo} />
                      <div className="sub" style={{ marginTop: 4 }}>
                        {t.vinculo === "diaria"
                          ? `${fmtBRL(t.valor)}/dia`
                          : t.vinculo === "empreitada"
                            ? "Fechamento"
                            : `${fmtBRL(t.valor)}/mês`}
                      </div>
                      <div className="sub" style={{ fontSize: 11 }}>
                        {t.obra}
                      </div>
                    </div>
                    {t.vinculo === "diaria" ? (
                      DIAS.map((_, di) => (
                        <div
                          key={di}
                          className={
                            "folha-day-cell" +
                            (t.dias[di] ? " pres" : " aus")
                          }
                        >
                          {t.dias[di] ? (
                            <span
                              className="mono"
                              style={{
                                fontSize: 11,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {fmtBRLk(t.diasValor[di])}
                            </span>
                          ) : (
                            <span
                              style={{
                                color: "var(--ink-muted)",
                                fontSize: 16,
                              }}
                            >
                              ·
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div
                        className="folha-day-cell spans-6"
                        style={{
                          gridColumn: "span 6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--ink-muted)",
                          fontSize: 12,
                          fontStyle: "italic",
                        }}
                      >
                        {t.obs ?? "Não se aplica"}
                      </div>
                    )}
                    <div className="folha-total-cell">
                      <div
                        className="mono fin-neg"
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {fmtBRL(tot)}
                      </div>
                      {t.vinculo === "diaria" ? (
                        <div className="sub" style={{ fontSize: 11 }}>
                          {presencas}/6 dias
                        </div>
                      ) : null}
                    </div>
                    <div className="folha-status-cell">
                      <StatusBadge s={t.status} />
                    </div>
                  </div>
                )
              })}

              <div className="folha-row folha-totals">
                <div className="folha-sel"></div>
                <div
                  className="folha-nome-cell"
                  style={{ fontWeight: 600, color: "var(--ink)" }}
                >
                  Total do dia
                </div>
                <div className="sub">Somente diárias</div>
                {totPorDia.map((v, i) => (
                  <div key={i} className="folha-day-cell">
                    <span
                      className="mono fin-neg"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {fmtBRLk(v)}
                    </span>
                  </div>
                ))}
                <div className="folha-total-cell">
                  <div
                    className="mono fin-neg"
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtBRL(totalSem)}
                  </div>
                </div>
                <div></div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
