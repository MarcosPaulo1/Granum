"use client"

// Port literal de granum-design/app.jsx + "Painel da Obra.html"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { differenceInCalendarDays, parseISO } from "date-fns"

import { DiariosTab } from "@/components/obra-tabs/diarios-tab"
import { DocumentosTab } from "@/components/obra-tabs/documentos-tab"
import { EquipeTab } from "@/components/obra-tabs/equipe-tab"
import { FinanceiroTab } from "@/components/obra-tabs/financeiro-tab"
import { TarefasTab } from "@/components/obra-tabs/tarefas-tab"
import { Icon } from "@/components/granum/icon"
import { ObraForm } from "@/components/forms/obra-form"
import { useUser } from "@/lib/hooks/use-user"
import { OBRA_STATUS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils/format"

interface Obra {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  descricao: string | null
  endereco: string | null
  data_inicio_prevista: string | null
  data_fim_prevista: string | null
  data_inicio_real: string | null
  data_fim_real: string | null
  id_cliente: number
  id_centro_custo: number | null
  id_responsavel: number | null
}

const STATUS_META: Record<
  string,
  { label: string; dot: string; bg: string; fg: string }
> = {
  em_andamento: {
    label: "Em andamento",
    dot: "var(--info)",
    bg: "var(--info-soft)",
    fg: "var(--info-ink)",
  },
  atrasada: {
    label: "Atrasada",
    dot: "var(--danger)",
    bg: "var(--danger-soft)",
    fg: "var(--danger-ink)",
  },
  pausada: {
    label: "Pausada",
    dot: "var(--warning)",
    bg: "var(--warning-soft)",
    fg: "var(--warning-ink)",
  },
  planejamento: {
    label: "Planejamento",
    dot: "var(--planned)",
    bg: "var(--surface-muted)",
    fg: "var(--ink-muted)",
  },
  concluida: {
    label: "Concluída",
    dot: "var(--success)",
    bg: "var(--success-soft)",
    fg: "var(--success-ink)",
  },
  cancelada: {
    label: "Cancelada",
    dot: "var(--danger)",
    bg: "var(--danger-soft)",
    fg: "var(--danger-ink)",
  },
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtBRLk(v: number): string {
  if (!v) return "R$ 0"
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000) return "R$ " + Math.round(v / 1000) + " mil"
  return "R$ " + v
}

function StatusBadge({ s }: { s: string }) {
  const m = STATUS_META[s] ?? STATUS_META.em_andamento
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        background: m.bg,
        color: m.fg,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: m.dot,
        }}
      />
      {m.label}
    </span>
  )
}

export default function ObraPainelPage() {
  const params = useParams()
  const { role } = useUser()
  const [obra, setObra] = useState<Obra | null>(null)
  const [clienteNome, setClienteNome] = useState("")
  const [responsavelNome, setResponsavelNome] = useState("")
  const [counts, setCounts] = useState({
    tarefas: 0,
    equipe: 0,
    docs: 0,
    diarios: 0,
  })
  const [orcamento, setOrcamento] = useState(0)
  const [tab, setTab] = useState<
    "resumo" | "tarefas" | "equipe" | "financeiro" | "documentos" | "diarios"
  >("resumo")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: o } = await supabase
      .from("obra")
      .select("*")
      .eq("id_obra", id)
      .single()
    if (!o) return
    setObra(o as Obra)

    const { data: cli } = await supabase
      .from("cliente")
      .select("nome")
      .eq("id_cliente", o.id_cliente)
      .single()
    setClienteNome((cli as { nome: string } | null)?.nome ?? "")

    if (o.id_responsavel) {
      const { data: resp } = await supabase
        .from("responsavel")
        .select("nome")
        .eq("id_responsavel", o.id_responsavel)
        .single()
      setResponsavelNome((resp as { nome: string } | null)?.nome ?? "")
    }

    const [
      { count: tarefasCount },
      { count: contratosCount },
      { count: docsCount },
      { count: diariosCount },
      { data: lancs },
    ] = await Promise.all([
      supabase
        .from("tarefa")
        .select("*", { count: "exact", head: true })
        .eq("id_obra", id),
      supabase
        .from("contrato_trabalho")
        .select("*", { count: "exact", head: true })
        .eq("id_obra", id)
        .eq("status", "ativo"),
      supabase
        .from("documento")
        .select("*", { count: "exact", head: true })
        .eq("id_obra", id),
      supabase
        .from("diario_obra")
        .select("*", { count: "exact", head: true })
        .eq("id_obra", id),
      supabase
        .from("lancamento")
        .select("valor, tipo")
        .eq("id_obra", id)
        .eq("tipo", "planejado"),
    ])

    setCounts({
      tarefas: tarefasCount ?? 0,
      equipe: contratosCount ?? 0,
      docs: docsCount ?? 0,
      diarios: diariosCount ?? 0,
    })
    setOrcamento(
      (lancs ?? []).reduce(
        (a: number, l: { valor: number }) => a + Number(l.valor),
        0
      )
    )
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  if (!obra) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Carregando obra…
      </div>
    )
  }

  const obraCode = `OBR-${String(obra.id_obra).padStart(4, "0")}`
  const pct = Math.round(obra.percentual_finalizada ?? 0)
  const today = new Date()
  const fim = obra.data_fim_prevista ? parseISO(obra.data_fim_prevista) : null
  const atrasado =
    fim && fim < today && obra.status === "em_andamento"
  const statusToShow = atrasado ? "atrasada" : obra.status

  const tabs = [
    { id: "resumo", label: "Resumo", icon: "layout", count: undefined },
    {
      id: "tarefas",
      label: "Tarefas",
      icon: "list",
      count: counts.tarefas,
    },
    {
      id: "equipe",
      label: "Equipe",
      icon: "users",
      count: counts.equipe,
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: "dollar",
      count: undefined,
    },
    {
      id: "documentos",
      label: "Documentos",
      icon: "folder",
      count: counts.docs,
    },
    {
      id: "diarios",
      label: "Diários",
      icon: "book",
      count: counts.diarios,
    },
  ] as const

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div
            className="page-head-title"
            style={{ minWidth: 0, flex: 1 }}
          >
            <div
              className="obra-id"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <span className="mono">{obraCode}</span>
              <span style={{ color: "var(--ink-soft)" }}>·</span>
              <StatusBadge s={statusToShow} />
            </div>
            <h1 style={{ margin: 0 }}>{obra.nome}</h1>
            <div
              className="subtitle"
              style={{
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              {clienteNome ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon
                    name="users"
                    style={{
                      width: 13,
                      height: 13,
                      color: "var(--ink-soft)",
                    }}
                  />
                  Cliente:{" "}
                  <Link
                    href={`/clientes/${obra.id_cliente}`}
                    style={{ color: "var(--ink)", fontWeight: 500 }}
                  >
                    {clienteNome}
                  </Link>
                </span>
              ) : null}
              {obra.endereco ? (
                <>
                  <span style={{ color: "var(--line-strong)" }}>·</span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Icon
                      name="mapPin"
                      style={{
                        width: 13,
                        height: 13,
                        color: "var(--ink-soft)",
                      }}
                    />
                    {obra.endereco}
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="sparkle" />
              Ação rápida
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setFormOpen(true)}
            >
              <Icon name="edit" />
              Editar obra
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setTab("tarefas")}
            >
              <Icon name="plus" />
              Nova tarefa
            </button>
            <button
              type="button"
              className="icon-btn"
              style={{
                border: "1px solid var(--line-strong)",
                height: 34,
                width: 34,
              }}
            >
              <Icon name="more" />
            </button>
          </div>
        </div>
        <div className="meta-row">
          <div className="meta-item">
            <span className="label">Progresso</span>
            <div className="progress-label" style={{ marginTop: 2 }}>
              <div className="progress">
                <div style={{ width: pct + "%", background: "var(--primary)" }} />
              </div>
              <span className="pct">{pct}%</span>
            </div>
          </div>
          <div className="meta-item">
            <span className="label">Responsável</span>
            <span className="value">
              {responsavelNome ? (
                <>
                  <span className="avatar-sm">{getInitials(responsavelNome)}</span>
                  {responsavelNome}
                </>
              ) : (
                <span style={{ color: "var(--ink-muted)" }}>—</span>
              )}
            </span>
          </div>
          <div className="meta-item">
            <span className="label">Início</span>
            <span className="value mono">
              {obra.data_inicio_prevista
                ? formatDate(obra.data_inicio_prevista)
                : "—"}
            </span>
          </div>
          <div className="meta-item">
            <span className="label">Previsão de entrega</span>
            <span className="value mono">
              {obra.data_fim_prevista
                ? formatDate(obra.data_fim_prevista)
                : "—"}
            </span>
          </div>
          <div className="meta-item">
            <span className="label">Orçamento</span>
            <span className="value mono">{fmtBRLk(orcamento)}</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={"tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} />
            {t.label}
            {t.count != null ? <span className="count">{t.count}</span> : null}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        {tab === "resumo" ? (
          <ResumoTab obra={obra} pct={pct} />
        ) : null}
        {tab === "tarefas" ? (
          <TarefasTab obraId={obra.id_obra} role={role} />
        ) : null}
        {tab === "equipe" ? <EquipeTab obraId={obra.id_obra} /> : null}
        {tab === "financeiro" ? (
          <FinanceiroTab obraId={obra.id_obra} />
        ) : null}
        {tab === "documentos" ? (
          <DocumentosTab obraId={obra.id_obra} />
        ) : null}
        {tab === "diarios" ? (
          <DiariosTab obraId={obra.id_obra} role={role} />
        ) : null}
      </div>

      <ObraForm
        open={formOpen}
        onOpenChange={setFormOpen}
        obra={obra as unknown as Record<string, unknown>}
        onSuccess={load}
      />
    </>
  )
}

function ResumoTab({ obra, pct }: { obra: Obra; pct: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>
      <div className="card">
        <div className="card-head">
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Resumo
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              Status atual da obra
            </div>
          </div>
        </div>
        <div className="card-body">
          <div
            style={{
              fontSize: 13,
              color: "var(--ink)",
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            {obra.descricao ??
              "A obra está em andamento. Use as abas acima para gerenciar tarefas, equipe, financeiro, documentos e diários."}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginTop: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 4,
                }}
              >
                Status do cronograma
              </div>
              <div className="progress" style={{ marginTop: 4 }}>
                <div
                  style={{
                    width: pct + "%",
                    background: "var(--primary)",
                  }}
                />
              </div>
              <div
                style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 4 }}
              >
                {pct}% concluído
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 4,
                }}
              >
                Status atual
              </div>
              <span
                className="badge dot"
                style={{
                  background: "var(--info-soft)",
                  color: "var(--info-ink)",
                }}
              >
                {(OBRA_STATUS as Record<string, { label: string }>)[
                  obra.status
                ]?.label ?? obra.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Endereço
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Local da obra</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
            {obra.endereco ?? (
              <span style={{ color: "var(--ink-muted)" }}>
                Endereço não informado.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
