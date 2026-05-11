"use client"

// Port literal de granum-design/tab-tarefas.jsx

import { useCallback, useEffect, useMemo, useState } from "react"
import { differenceInDays, parseISO } from "date-fns"
import { toast } from "sonner"

import { TarefaForm } from "@/components/forms/tarefa-form"
import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils/format"

interface Tarefa {
  id_tarefa: number
  nome: string
  status: string
  percentual_concluido: number
  data_inicio: string | null
  data_fim: string | null
  orcamento_previsto: number
  id_etapa: number | null
  id_responsavel: number | null
  descricao: string | null
  ordem: number
}

interface TarefaRow extends Tarefa {
  etapaNome: string
  etapaColor: string
  respNome: string
  respInit: string
  inicioFmt: string
  fimFmt: string
  start: number
  end: number
  realizado: number
  uiStatus: "done" | "andamento" | "atrasada" | "planejamento" | "pausada"
}

const ETAPA_COLORS = [
  "var(--info)",
  "var(--primary)",
  "var(--warning-ink)",
  "#0284C7",
  "#7C3AED",
  "#DC2626",
  "var(--success-ink)",
  "var(--ink-muted)",
]

const STATUS_META: Record<
  string,
  { label: string; bg: string; fg: string; dot: string }
> = {
  done: {
    label: "Concluída",
    bg: "var(--success-soft)",
    fg: "var(--success-ink)",
    dot: "var(--success)",
  },
  andamento: {
    label: "Em andamento",
    bg: "var(--info-soft)",
    fg: "var(--info-ink)",
    dot: "var(--info)",
  },
  atrasada: {
    label: "Atrasada",
    bg: "var(--danger-soft)",
    fg: "var(--danger-ink)",
    dot: "var(--danger)",
  },
  planejamento: {
    label: "Planejada",
    bg: "var(--surface-muted)",
    fg: "var(--ink-muted)",
    dot: "var(--planned)",
  },
  pausada: {
    label: "Pausada",
    bg: "var(--warning-soft)",
    fg: "var(--warning-ink)",
    dot: "var(--warning)",
  },
}

function fmtBRL(v: number): string {
  if (!v) return "R$ 0"
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000) return "R$ " + Math.round(v / 1000) + " mil"
  return "R$ " + v
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function StatusPill({ s }: { s: TarefaRow["uiStatus"] }) {
  const m = STATUS_META[s] ?? STATUS_META.planejamento
  return (
    <span
      className="badge"
      style={{
        background: m.bg,
        color: m.fg,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: m.dot,
          marginRight: 6,
        }}
      ></span>
      {m.label}
    </span>
  )
}

function EtapaChip({ nome, color }: { nome: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        background:
          "color-mix(in oklab, " + color + " 14%, var(--surface-muted))",
        color,
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {nome}
    </span>
  )
}

function deriveUiStatus(t: Tarefa): TarefaRow["uiStatus"] {
  if (t.status === "concluida") return "done"
  if (t.status === "em_andamento") return "andamento"
  if (t.status === "pausada") return "pausada"
  if (t.status === "cancelada") return "planejamento"
  if (t.status === "bloqueada") return "atrasada"
  if (t.data_fim && parseISO(t.data_fim) < new Date()) return "atrasada"
  return "planejamento"
}

interface TarefasTabProps {
  obraId: number
  role: string | null
}

export function TarefasTab({ obraId, role }: TarefasTabProps) {
  const [tarefas, setTarefas] = useState<TarefaRow[]>([])
  const [etapasMap, setEtapasMap] = useState<Map<number, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"gantt" | "lista">("gantt")
  const [fStatus, setFStatus] = useState<"todos" | TarefaRow["uiStatus"]>(
    "todos"
  )
  const [fEtapa, setFEtapa] = useState<"todas" | string>("todas")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarefa, setEditTarefa] = useState<Tarefa | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("tarefa")
      .select("*")
      .eq("id_obra", obraId)
      .order("ordem")

    const { data: etapas } = await supabase
      .from("etapa")
      .select("id_etapa, nome")
    const etpMap = new Map(
      (etapas ?? []).map(
        (e: { id_etapa: number; nome: string }) => [e.id_etapa, e.nome]
      )
    )
    setEtapasMap(etpMap)

    const list = (data ?? []) as Tarefa[]
    const respIds = Array.from(
      new Set(list.filter((t) => t.id_responsavel).map((t) => t.id_responsavel!))
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

    // Calcular range Gantt
    const dates = list
      .flatMap((t) => [t.data_inicio, t.data_fim])
      .filter(Boolean) as string[]
    const minDate =
      dates.length > 0
        ? dates.reduce((a, b) => (a < b ? a : b))
        : new Date().toISOString()
    const maxDate =
      dates.length > 0
        ? dates.reduce((a, b) => (a > b ? a : b))
        : new Date().toISOString()
    const start = parseISO(minDate)
    const end = parseISO(maxDate)
    const totalDays = Math.max(1, differenceInDays(end, start))

    setTarefas(
      list.map((t) => {
        const idxColor = (t.id_etapa ?? 0) % ETAPA_COLORS.length
        const startDays = t.data_inicio
          ? differenceInDays(parseISO(t.data_inicio), start)
          : 0
        const endDays = t.data_fim
          ? differenceInDays(parseISO(t.data_fim), start)
          : startDays + 1
        return {
          ...t,
          etapaNome: t.id_etapa
            ? etpMap.get(t.id_etapa) ?? "Sem etapa"
            : "Sem etapa",
          etapaColor: ETAPA_COLORS[idxColor],
          respNome: t.id_responsavel
            ? respMap.get(t.id_responsavel) ?? ""
            : "",
          respInit: t.id_responsavel
            ? getInitials(respMap.get(t.id_responsavel) ?? "")
            : "",
          inicioFmt: t.data_inicio ? formatDate(t.data_inicio).slice(0, 8) : "—",
          fimFmt: t.data_fim ? formatDate(t.data_fim).slice(0, 8) : "—",
          start: (startDays / totalDays) * 12 + 1,
          end: (endDays / totalDays) * 12 + 1,
          realizado: 0,
          uiStatus: deriveUiStatus(t),
        }
      })
    )
    setIsLoading(false)
  }, [obraId])

  useEffect(() => {
    load()
  }, [load])

  async function recalcObraPercentual() {
    const supabase = createClient()
    const { data: all } = await supabase
      .from("tarefa")
      .select("percentual_concluido")
      .eq("id_obra", obraId)
    if (all && all.length > 0) {
      const avg =
        (all as { percentual_concluido: number }[]).reduce(
          (s, t) => s + t.percentual_concluido,
          0
        ) / all.length
      await supabase
        .from("obra")
        .update({ percentual_finalizada: Math.round(avg * 100) / 100 })
        .eq("id_obra", obraId)
    }
  }

  const filtered = useMemo(
    () =>
      tarefas.filter((t) => {
        if (fStatus !== "todos" && t.uiStatus !== fStatus) return false
        if (fEtapa !== "todas" && String(t.id_etapa) !== fEtapa) return false
        if (busca && !t.nome.toLowerCase().includes(busca.toLowerCase()))
          return false
        return true
      }),
    [tarefas, fStatus, fEtapa, busca]
  )

  const totalW = 12
  const barLeft = (s: number) => ((s - 1) / totalW) * 100
  const barWidth = (s: number, e: number) => ((e - s) / totalW) * 100
  // today position in Gantt range
  const todayPos = (() => {
    const dates = tarefas
      .flatMap((t) => [t.data_inicio, t.data_fim])
      .filter(Boolean) as string[]
    if (dates.length === 0) return 0
    const start = parseISO(dates.reduce((a, b) => (a < b ? a : b)))
    const end = parseISO(dates.reduce((a, b) => (a > b ? a : b)))
    const todayDays = differenceInDays(new Date(), start)
    const totalDays = Math.max(1, differenceInDays(end, start))
    return Math.max(0, Math.min(100, (todayDays / totalDays) * 100))
  })()

  const concluidas = tarefas.filter((t) => t.uiStatus === "done").length
  const andamento = tarefas.filter((t) => t.uiStatus === "andamento").length
  const atrasadas = tarefas.filter((t) => t.uiStatus === "atrasada").length
  const planejadas = tarefas.filter(
    (t) => t.uiStatus === "planejamento"
  ).length
  const totalOrcamento = tarefas.reduce(
    (a, t) => a + Number(t.orcamento_previsto ?? 0),
    0
  )
  const totalRealizado = tarefas.reduce((a, t) => a + t.realizado, 0)

  const etapaOptions = Array.from(etapasMap.entries())

  const canEdit = role === "diretor" || role === "engenheiro"

  return (
    <>
      <div className="list-kpis cols-5">
        <div className="list-kpi">
          <div className="list-kpi-label">Total de tarefas</div>
          <div className="list-kpi-value">{tarefas.length}</div>
          <div className="list-kpi-sub">
            <Icon name="list" />
            Cronograma completo
          </div>
        </div>
        <div className="list-kpi tone-success">
          <div className="list-kpi-label">Concluídas</div>
          <div className="list-kpi-value">{concluidas}</div>
          <div className="list-kpi-sub">
            <Icon name="check" />
            {tarefas.length > 0
              ? Math.round((concluidas / tarefas.length) * 100)
              : 0}
            % do total
          </div>
        </div>
        <div className="list-kpi tone-info">
          <div className="list-kpi-label">Em andamento</div>
          <div className="list-kpi-value">{andamento}</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            Executando agora
          </div>
        </div>
        <div className="list-kpi tone-danger">
          <div className="list-kpi-label">Atrasadas</div>
          <div className="list-kpi-value">{atrasadas}</div>
          <div className="list-kpi-sub">
            <Icon name="alertTriangle" />
            Requer atenção
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Planejadas</div>
          <div className="list-kpi-value">{planejadas}</div>
          <div className="list-kpi-sub">
            <Icon name="calendar" />
            Ainda não iniciadas
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar tarefa por nome…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <div className="seg-select">
              <Icon name="layers" />
              <select
                value={fEtapa}
                onChange={(e) => setFEtapa(e.target.value)}
              >
                <option value="todas">Todas as etapas</option>
                {etapaOptions.map(([id, nome]) => (
                  <option key={id} value={String(id)}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todas" },
                  { id: "andamento", label: "Em andamento" },
                  { id: "atrasada", label: "Atrasadas" },
                  { id: "done", label: "Concluídas" },
                  { id: "planejamento", label: "Planejadas" },
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
            <div className="seg">
              <button
                type="button"
                className={"seg-btn" + (view === "gantt" ? " active" : "")}
                onClick={() => setView("gantt")}
              >
                <Icon name="calendar" /> Gantt
              </button>
              <button
                type="button"
                className={"seg-btn" + (view === "lista" ? " active" : "")}
                onClick={() => setView("lista")}
              >
                <Icon name="list" /> Lista
              </button>
            </div>
            {canEdit ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditTarefa(null)
                  setFormOpen(true)
                }}
              >
                <Icon name="plus" />
                Nova
              </button>
            ) : null}
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
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: "var(--ink-muted)",
              fontSize: 13.5,
            }}
          >
            {tarefas.length === 0
              ? "Nenhuma tarefa cadastrada ainda."
              : "Nenhuma tarefa com esses filtros."}
          </div>
        ) : view === "gantt" ? (
          <div>
            <div
              style={{
                display: "flex",
                gap: 18,
                padding: "10px 20px",
                borderBottom: "1px solid var(--line)",
                background: "var(--surface-muted)",
                fontSize: 11.5,
                color: "var(--ink-muted)",
                flexWrap: "wrap",
              }}
            >
              {[
                { c: "var(--success)", l: "Concluída" },
                { c: "var(--info)", l: "Em andamento" },
                { c: "var(--danger)", l: "Atrasada" },
                { c: "var(--planned)", l: "Planejada", border: true },
              ].map((x) => (
                <span
                  key={x.l}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 10,
                      background: x.c,
                      borderRadius: 3,
                      border: x.border
                        ? "1px solid var(--line-strong)"
                        : "none",
                      opacity: x.border ? 0.5 : 1,
                    }}
                  />
                  {x.l}
                </span>
              ))}
              <span
                style={{
                  marginLeft: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 2,
                    height: 12,
                    background: "var(--ink)",
                    opacity: 0.7,
                  }}
                />{" "}
                hoje
              </span>
            </div>

            <div className="gantt">
              <div className="gantt-today-column">
                <div
                  className="gantt-today"
                  style={{ left: `calc(${todayPos}% - 1px)` }}
                >
                  <div className="gantt-today-label" style={{ left: 1 }}>
                    hoje
                  </div>
                </div>
              </div>
              <div className="gantt-header">
                <div className="left">Tarefa / Etapa</div>
                <div className="right">
                  {[
                    "Ago",
                    "Set",
                    "Out",
                    "Nov",
                    "Dez",
                    "Jan",
                    "Fev",
                    "Mar",
                    "Abr",
                    "Mai",
                    "Jun",
                    "Jul",
                  ].map((m, i) => (
                    <span
                      key={i}
                      style={{
                        borderLeft:
                          i === 0
                            ? "none"
                            : i % 3 === 0
                              ? "1px solid var(--line-strong)"
                              : "1px solid var(--line)",
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              {filtered.map((t) => (
                <div className="gantt-row" key={t.id_tarefa}>
                  <div className="left">
                    <div className="task-name">{t.nome}</div>
                    <div
                      className="etapa"
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <EtapaChip nome={t.etapaNome} color={t.etapaColor} />
                      {t.respInit ? (
                        <span style={{ color: "var(--ink-soft)", fontSize: 11 }}>
                          {t.respInit}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="right">
                    <div
                      className={
                        "gantt-bar " +
                        (t.uiStatus === "done"
                          ? "done"
                          : t.uiStatus === "planejamento"
                            ? "planejamento"
                            : t.uiStatus === "atrasada"
                              ? "atrasada"
                              : "")
                      }
                      style={{
                        left: barLeft(t.start) + "%",
                        width: barWidth(t.start, t.end) + "%",
                      }}
                      title={`${t.nome} · ${t.percentual_concluido}%`}
                    >
                      {(t.uiStatus === "andamento" ||
                        t.uiStatus === "atrasada") &&
                      t.percentual_concluido > 0 ? (
                        <div
                          className="bar-fill"
                          style={{ width: t.percentual_concluido + "%" }}
                        />
                      ) : null}
                      <span className="bar-label">{t.nome}</span>
                      <span className="bar-pct">{t.percentual_concluido}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="list-table list-tarefas">
            <div className="list-thead">
              <div>Tarefa</div>
              <div>Etapa</div>
              <div>Período</div>
              <div>Responsável</div>
              <div>Progresso</div>
              <div className="num">Orçamento</div>
              <div>Status</div>
              <div></div>
            </div>
            {filtered.map((t) => (
              <div
                className={
                  "list-row2" + (t.uiStatus === "atrasada" ? " row-danger" : "")
                }
                key={t.id_tarefa}
              >
                <div className="list-cell-name">
                  <span className="task-num mono">
                    #{String(t.id_tarefa).padStart(2, "0")}
                  </span>
                  <div className="list-name-block">
                    <div className="nm">
                      <a>{t.nome}</a>
                    </div>
                    <div className="sub">
                      {t.percentual_concluido === 100
                        ? "Concluída"
                        : `${100 - t.percentual_concluido}% pendente`}
                    </div>
                  </div>
                </div>
                <div>
                  <EtapaChip nome={t.etapaNome} color={t.etapaColor} />
                </div>
                <div>
                  <div className="em mono">{t.inicioFmt}</div>
                  <div className="sub mono">→ {t.fimFmt}</div>
                </div>
                <div className="list-cell-contact">
                  {t.respNome ? (
                    <div
                      className="em"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span className="avatar-xs">{t.respInit}</span>
                      {t.respNome}
                    </div>
                  ) : (
                    <span className="sub">—</span>
                  )}
                </div>
                <div className="list-cell-progress">
                  <div className="obra-progress">
                    <div className="obra-progress-track">
                      <div
                        className="obra-progress-fill"
                        style={{
                          width: t.percentual_concluido + "%",
                          background:
                            t.uiStatus === "done"
                              ? "var(--success)"
                              : t.uiStatus === "atrasada"
                                ? "var(--danger)"
                                : t.uiStatus === "planejamento"
                                  ? "var(--planned)"
                                  : "var(--info)",
                        }}
                      ></div>
                    </div>
                    <div className="obra-progress-pct mono">
                      {t.percentual_concluido}%
                    </div>
                  </div>
                </div>
                <div className="list-cell-num">
                  <div className="val mono">
                    {fmtBRL(Number(t.orcamento_previsto ?? 0))}
                  </div>
                </div>
                <div className="list-cell-status">
                  <StatusPill s={t.uiStatus} />
                </div>
                <div className="list-cell-actions">
                  {canEdit ? (
                    <button
                      type="button"
                      className="icon-btn"
                      title="Editar"
                      onClick={() => {
                        setEditTarefa(t)
                        setFormOpen(true)
                      }}
                    >
                      <Icon name="edit" />
                    </button>
                  ) : null}
                  <button type="button" className="icon-btn">
                    <Icon name="more" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="list-foot">
          <div className="sub">
            Mostrando {filtered.length} de {tarefas.length} tarefas · Orçamento{" "}
            <strong className="mono" style={{ color: "var(--ink)" }}>
              {fmtBRL(totalOrcamento)}
            </strong>
            {totalRealizado > 0 ? (
              <>
                {" "}
                · Realizado{" "}
                <strong className="mono" style={{ color: "var(--ink)" }}>
                  {fmtBRL(totalRealizado)}
                </strong>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <TarefaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        obraId={obraId}
        tarefa={editTarefa as unknown as Record<string, unknown> | null}
        onSuccess={async () => {
          await recalcObraPercentual()
          load()
        }}
      />
    </>
  )
}

void toast
