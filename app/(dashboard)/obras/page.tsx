"use client"

// Port literal de granum-design/obras-app.jsx + Obras.html

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { differenceInCalendarDays, parseISO } from "date-fns"
import { toast } from "sonner"

import { ObraForm } from "@/components/forms/obra-form"
import { Icon } from "@/components/granum/icon"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils/format"

interface ObraRow {
  id: string
  rawId: number
  nome: string
  cliente: string
  clienteInit: string
  responsavel: { nome: string; init: string }
  endereco: string
  status: string
  progresso: number
  inicio: string
  fim: string
  diasAteFim: number
  atrasado: boolean
  orcamento: number
  realizado: number
  tarefasTotal: number
  tarefasConcluidas: number
  tarefasAtrasadas: number
  equipe: number
  entregue?: string
}

const STATUS_META: Record<
  string,
  { label: string; tone: string; dot: string; fg: string; bg: string }
> = {
  planejamento: {
    label: "Planejamento",
    tone: "neutral",
    dot: "var(--planned)",
    fg: "var(--ink-muted)",
    bg: "var(--surface-muted)",
  },
  em_andamento: {
    label: "Em andamento",
    tone: "info",
    dot: "var(--info)",
    fg: "var(--info-ink)",
    bg: "var(--info-soft)",
  },
  pausada: {
    label: "Pausada",
    tone: "warning",
    dot: "var(--warning)",
    fg: "var(--warning-ink)",
    bg: "var(--warning-soft)",
  },
  concluida: {
    label: "Concluída",
    tone: "success",
    dot: "var(--success)",
    fg: "var(--success-ink)",
    bg: "var(--success-soft)",
  },
  cancelada: {
    label: "Cancelada",
    tone: "danger",
    dot: "var(--danger)",
    fg: "var(--danger-ink)",
    bg: "var(--danger-soft)",
  },
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
  if (v >= 1000) return "R$ " + Math.round(v / 1000).toLocaleString("pt-BR") + " mil"
  return "R$ " + v.toLocaleString("pt-BR")
}

function StatusBadge({ s }: { s: string }) {
  const m = STATUS_META[s] ?? STATUS_META.planejamento
  return (
    <span
      className="badge"
      style={{
        background: m.bg,
        color: m.fg,
        fontSize: 11,
        fontWeight: 500,
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

function ObraProgress({
  pct,
  status,
  atrasado,
}: {
  pct: number
  status: string
  atrasado: boolean
}) {
  let color = "var(--info)"
  if (status === "concluida") color = "var(--success)"
  else if (status === "pausada") color = "var(--warning)"
  else if (status === "planejamento") color = "var(--planned)"
  else if (atrasado) color = "var(--danger)"
  return (
    <div className="obra-progress">
      <div className="obra-progress-track">
        <div
          className="obra-progress-fill"
          style={{ width: pct + "%", background: color }}
        ></div>
      </div>
      <div
        className="obra-progress-pct mono"
        style={{
          color: atrasado ? "var(--danger-ink)" : "var(--ink)",
        }}
      >
        {pct}%
      </div>
    </div>
  )
}

export default function ObrasPage() {
  const router = useRouter()
  const { role } = useUser()
  const [rows, setRows] = useState<ObraRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fStatus, setFStatus] = useState<"todos" | string>("todos")
  const [fResp, setFResp] = useState<"todos" | string>("todos")
  const [busca, setBusca] = useState("")
  const [view, setView] = useState<"tabela" | "grade">("tabela")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: obras, error } = await supabase
      .from("obra")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }

    const list = obras ?? []
    const cliIds = Array.from(new Set(list.map((o) => o.id_cliente)))
    const respIds = Array.from(
      new Set(list.filter((o) => o.id_responsavel).map((o) => o.id_responsavel!))
    )

    const [{ data: clientes }, { data: resps }] = await Promise.all([
      cliIds.length
        ? supabase
            .from("cliente")
            .select("id_cliente, nome")
            .in("id_cliente", cliIds)
        : Promise.resolve({ data: [] as { id_cliente: number; nome: string }[] }),
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
      (clientes ?? []).map((c) => [c.id_cliente, c.nome])
    )
    const respMap = new Map(
      (resps ?? []).map((r) => [r.id_responsavel, r.nome])
    )

    const today = new Date()
    setRows(
      list.map((o) => {
        const fim = o.data_fim_prevista
        const diasAteFim = fim
          ? differenceInCalendarDays(parseISO(fim), today)
          : 0
        const atrasado =
          diasAteFim < 0 &&
          o.status !== "concluida" &&
          o.status !== "cancelada"
        const cliNome = cliMap.get(o.id_cliente) ?? ""
        const respNome = o.id_responsavel
          ? respMap.get(o.id_responsavel) ?? ""
          : ""
        return {
          id: `OBR-${String(o.id_obra).padStart(4, "0")}`,
          rawId: o.id_obra,
          nome: o.nome,
          cliente: cliNome,
          clienteInit: getInitials(cliNome),
          responsavel: { nome: respNome, init: getInitials(respNome) },
          endereco: o.endereco ?? "",
          status: o.status ?? "planejamento",
          progresso: Math.round(o.percentual_finalizada ?? 0),
          inicio: o.data_inicio_prevista
            ? formatDate(o.data_inicio_prevista)
            : "—",
          fim: o.data_fim_prevista ? formatDate(o.data_fim_prevista) : "—",
          diasAteFim,
          atrasado,
          orcamento: 0,
          realizado: 0,
          tarefasTotal: 0,
          tarefasConcluidas: 0,
          tarefasAtrasadas: 0,
          equipe: 0,
          entregue: o.data_fim_real ? formatDate(o.data_fim_real) : undefined,
        }
      })
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const responsaveis = useMemo(
    () =>
      Array.from(
        new Set(rows.map((o) => o.responsavel.nome).filter(Boolean))
      ).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((o) => {
        if (fStatus !== "todos" && o.status !== fStatus) return false
        if (fResp !== "todos" && o.responsavel.nome !== fResp) return false
        if (
          busca &&
          !(o.nome + o.cliente + o.id)
            .toLowerCase()
            .includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [rows, fStatus, fResp, busca]
  )

  const ativas = rows.filter((o) => o.status === "em_andamento").length
  const pausadas = rows.filter((o) => o.status === "pausada").length
  const atrasadas = rows.filter((o) => o.atrasado).length
  const planejadas = rows.filter((o) => o.status === "planejamento").length

  const canCreate = role === "diretor" || role === "arquiteta"

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Portfólio</div>
            <h1>Obras</h1>
            <div className="subtitle">
              {rows.length} obras no portfólio · {ativas} em andamento ·{" "}
              {atrasadas > 0 ? (
                <span style={{ color: "var(--danger-ink)", fontWeight: 500 }}>
                  {atrasadas} com atraso
                </span>
              ) : (
                "0 atrasadas"
              )}
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="download" />
              Exportar
            </button>
            {canCreate ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setFormOpen(true)}
              >
                <Icon name="plus" />
                Nova obra
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi tone-info">
          <div className="list-kpi-label">Em andamento</div>
          <div className="list-kpi-value">{ativas}</div>
          <div className="list-kpi-sub">
            <Icon name="construction" />
            Canteiros ativos agora
          </div>
        </div>
        <div className="list-kpi tone-warning">
          <div className="list-kpi-label">Pausadas</div>
          <div className="list-kpi-value">{pausadas}</div>
          <div className="list-kpi-sub">
            <Icon name="clock" />
            Aguardando desimpedimento
          </div>
        </div>
        <div className="list-kpi tone-danger">
          <div className="list-kpi-label">Com atraso</div>
          <div className="list-kpi-value">{atrasadas}</div>
          <div className="list-kpi-sub">
            <Icon name="alertTriangle" />
            Exigem atenção imediata
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Planejamento</div>
          <div className="list-kpi-value">{planejadas}</div>
          <div className="list-kpi-sub">
            <Icon name="layout" />
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
              placeholder="Buscar por nome da obra, cliente ou código…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todas" },
                  { id: "em_andamento", label: "Em andamento" },
                  { id: "pausada", label: "Pausadas" },
                  { id: "planejamento", label: "Planejamento" },
                  { id: "concluida", label: "Concluídas" },
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
            <div className="seg-select">
              <Icon name="user" />
              <select
                value={fResp}
                onChange={(e) => setFResp(e.target.value)}
              >
                <option value="todos">Todos responsáveis</option>
                {responsaveis.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="seg">
              <button
                type="button"
                className={"seg-btn" + (view === "tabela" ? " active" : "")}
                onClick={() => setView("tabela")}
                title="Visão em tabela"
              >
                <Icon name="list" />
              </button>
              <button
                type="button"
                className={"seg-btn" + (view === "grade" ? " active" : "")}
                onClick={() => setView("grade")}
                title="Visão em cards"
              >
                <Icon name="layers" />
              </button>
            </div>
          </div>
        </div>

        {view === "tabela" ? (
          <div className="list-table list-obras">
            <div className="list-thead">
              <div>Obra</div>
              <div>Cliente</div>
              <div>Responsável</div>
              <div>Prazo</div>
              <div>Progresso</div>
              <div className="num">Orçamento</div>
              <div>Status</div>
              <div></div>
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
                Nenhuma obra encontrada com esses filtros.
              </div>
            ) : (
              filtered.map((o) => (
                <div
                  className={"list-row2" + (o.atrasado ? " row-danger" : "")}
                  key={o.id}
                  onClick={() => router.push(`/obras/${o.rawId}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="list-cell-name">
                    <span
                      className="avatar-sm avatar-obra"
                      style={{
                        background: STATUS_META[o.status]?.bg,
                        color: STATUS_META[o.status]?.fg,
                      }}
                    >
                      <Icon name="construction" />
                    </span>
                    <div className="list-name-block">
                      <div className="nm">
                        <a>{o.nome}</a>
                      </div>
                      <div className="sub">
                        {o.id}
                        {o.endereco ? ` · ${o.endereco}` : ""}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="em">{o.cliente || "—"}</div>
                    <div className="sub">
                      {o.tarefasTotal} tarefas · {o.equipe} na equipe
                    </div>
                  </div>
                  <div className="list-cell-contact">
                    <div
                      className="em"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {o.responsavel.nome ? (
                        <>
                          <span className="avatar-xs">
                            {o.responsavel.init}
                          </span>
                          {o.responsavel.nome}
                        </>
                      ) : (
                        <span style={{ color: "var(--ink-muted)" }}>—</span>
                      )}
                    </div>
                  </div>
                  <div className="list-cell-prazo">
                    <div className="mono sub">
                      {o.inicio} → {o.fim}
                    </div>
                    {o.status === "concluida" && o.entregue ? (
                      <div
                        className="sub"
                        style={{
                          color: "var(--success-ink)",
                          fontWeight: 500,
                        }}
                      >
                        Entregue em {o.entregue}
                      </div>
                    ) : o.atrasado ? (
                      <div
                        className="sub"
                        style={{
                          color: "var(--danger-ink)",
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon name="alertTriangle" />
                        Atrasada · {Math.abs(o.diasAteFim)} dias
                      </div>
                    ) : (
                      <div className="sub">
                        {o.diasAteFim > 0
                          ? `Faltam ${o.diasAteFim} dias`
                          : "—"}
                      </div>
                    )}
                  </div>
                  <div className="list-cell-progress">
                    <ObraProgress
                      pct={o.progresso}
                      status={o.status}
                      atrasado={o.atrasado}
                    />
                  </div>
                  <div className="list-cell-num">
                    <div className="val mono">{fmtBRL(o.orcamento)}</div>
                    {o.orcamento > 0 ? (
                      <div
                        className="sub mono"
                        style={{
                          color:
                            o.realizado > o.orcamento
                              ? "var(--danger-ink)"
                              : "var(--ink-muted)",
                        }}
                      >
                        {Math.round((o.realizado / o.orcamento) * 100)}%
                        realizado
                      </div>
                    ) : null}
                  </div>
                  <div className="list-cell-status">
                    <StatusBadge s={o.status} />
                  </div>
                  <div className="list-cell-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Abrir painel"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/obras/${o.rawId}`)
                      }}
                    >
                      <Icon name="arrowRight" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icon name="more" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="obras-grid">
            {filtered.map((o) => (
              <a
                className={"obra-card" + (o.atrasado ? " is-danger" : "")}
                key={o.id}
                onClick={() => router.push(`/obras/${o.rawId}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="obra-card-top">
                  <StatusBadge s={o.status} />
                  <div className="obra-card-id mono">{o.id}</div>
                </div>
                <div className="obra-card-title">{o.nome}</div>
                <div className="obra-card-meta">
                  <span className="avatar-xs">{o.clienteInit}</span>
                  {o.cliente || "—"}
                </div>
                <div className="obra-card-progress">
                  <ObraProgress
                    pct={o.progresso}
                    status={o.status}
                    atrasado={o.atrasado}
                  />
                </div>
                <div className="obra-card-foot">
                  <div>
                    <div className="sub">Prazo</div>
                    <div className="em mono">{o.fim}</div>
                  </div>
                  <div>
                    <div className="sub">Equipe</div>
                    <div className="em">{o.equipe} pessoas</div>
                  </div>
                  <div>
                    <div className="sub">Realizado</div>
                    <div className="em mono">{fmtBRL(o.realizado)}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="list-foot">
          <div className="sub">
            Mostrando {filtered.length} de {rows.length} obras
          </div>
          <div className="list-pag">
            <button className="icon-btn" disabled>
              <Icon name="chevronLeft" />
            </button>
            <span className="mono">1 / 1</span>
            <button className="icon-btn" disabled>
              <Icon name="chevronRight" />
            </button>
          </div>
        </div>
      </div>

      <ObraForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </>
  )
}
