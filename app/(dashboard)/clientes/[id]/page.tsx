"use client"

// Port literal de granum-design/cliente-perfil-app.jsx + ClientePerfil.html

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { ClienteForm } from "@/components/forms/cliente-form"
import { Icon } from "@/components/granum/icon"
import { OBRA_STATUS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatCPFCNPJ, formatDate, formatPhone } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Cliente = Database["public"]["Tables"]["cliente"]["Row"]

interface ObraResumo {
  id_obra: number
  id: string
  nome: string
  status: string
  progresso: number
  inicio: string
  fim: string
  responsavel: string
  tarefas: number
  equipe: number
  valor: number
  realizado: number
}

const STATUS_META: Record<
  string,
  { label: string; bg: string; fg: string; dot: string }
> = {
  em_andamento: {
    label: "Em andamento",
    bg: "var(--info-soft)",
    fg: "var(--info-ink)",
    dot: "var(--info)",
  },
  planejamento: {
    label: "Planejamento",
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
  concluida: {
    label: "Concluída",
    bg: "var(--success-soft)",
    fg: "var(--success-ink)",
    dot: "var(--success)",
  },
  cancelada: {
    label: "Cancelada",
    bg: "var(--danger-soft)",
    fg: "var(--danger-ink)",
    dot: "var(--danger)",
  },
}

function detectTipo(cpfCnpj: string | null): "PF" | "PJ" {
  if (!cpfCnpj) return "PF"
  return cpfCnpj.replace(/\D/g, "").length >= 14 ? "PJ" : "PF"
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

function fmtBRLfull(v: number): string {
  return (
    "R$ " +
    v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

function ObraStatusBadge({ s }: { s: string }) {
  const m = STATUS_META[s] ?? STATUS_META.planejamento
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 999,
        background: m.bg,
        color: m.fg,
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: m.dot,
        }}
      />
      {m.label}
    </span>
  )
}

export default function ClientePerfilPage() {
  const params = useParams()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [obras, setObras] = useState<ObraResumo[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)
    const { data: c } = await supabase
      .from("cliente")
      .select("*")
      .eq("id_cliente", id)
      .single()
    setCliente(c)

    const { data: o } = await supabase
      .from("obra")
      .select(
        "id_obra, nome, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista, id_responsavel"
      )
      .eq("id_cliente", id)
      .order("created_at", { ascending: false })

    const respIds = Array.from(
      new Set(
        (o ?? []).filter((x) => x.id_responsavel).map((x) => x.id_responsavel!)
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

    setObras(
      (o ?? []).map((x) => ({
        id_obra: x.id_obra,
        id: `OBR-${String(x.id_obra).padStart(4, "0")}`,
        nome: x.nome,
        status: x.status ?? "planejamento",
        progresso: Math.round(x.percentual_finalizada ?? 0),
        inicio: x.data_inicio_prevista
          ? formatDate(x.data_inicio_prevista)
          : "—",
        fim: x.data_fim_prevista ? formatDate(x.data_fim_prevista) : "—",
        responsavel: x.id_responsavel
          ? respMap.get(x.id_responsavel) ?? "—"
          : "—",
        tarefas: 0,
        equipe: 0,
        valor: 0,
        realizado: 0,
      }))
    )
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!cliente) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Carregando cliente…
      </div>
    )
  }

  const tipo = detectTipo(cliente.cpf_cnpj)
  const obrasAtivas = obras.filter(
    (o) => o.status === "em_andamento" || o.status === "planejamento"
  ).length
  const obrasConcluidas = obras.filter((o) => o.status === "concluida").length
  const totalContratado = obras.reduce((a, o) => a + o.valor, 0)
  const totalFaturado = obras.reduce((a, o) => a + o.realizado, 0)
  const code = `CLI-${String(cliente.id_cliente).padStart(4, "0")}`

  return (
    <>
      <div className="profile-head">
        <div
          className={"profile-avatar " + (tipo === "PJ" ? "tone-pj" : "")}
        >
          {getInitials(cliente.nome)}
        </div>
        <div className="profile-head-info">
          <div className="obra-id">
            {code} · {tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
          </div>
          <h1>{cliente.nome}</h1>
          <div className="badges">
            <span className="badge dot badge-success">Ativo</span>
            <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
              {obras.length} obras · {obrasAtivas} ativa
              {obrasAtivas !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="profile-head-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => setFormOpen(true)}
          >
            <Icon name="edit" />
            Editar dados
          </button>
          <Link href="/clientes" className="btn btn-secondary">
            <Icon name="external" />
            Voltar
          </Link>
        </div>
      </div>

      <div className="profile-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h3>Resumo</h3>
                <div className="sub">
                  Visão geral das obras associadas ao cliente
                </div>
              </div>
            </div>
            <div className="detail-stats">
              <div className="detail-stat">
                <div className="lbl">Total de obras</div>
                <div className="val">{obras.length}</div>
                <div className="sub">No histórico</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Ativas</div>
                <div className="val fin-pos">{obrasAtivas}</div>
                <div className="sub">Em execução ou planejamento</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Concluídas</div>
                <div className="val">{obrasConcluidas}</div>
                <div className="sub">Já entregues</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Faturado</div>
                <div className="val fin-pos">{fmtBRL(totalFaturado)}</div>
                <div className="sub">Soma de lançamentos</div>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h3>Obras do cliente</h3>
                <div className="sub">
                  {obrasAtivas} ativas · {obrasConcluidas} concluídas
                </div>
              </div>
            </div>
            <div className="detail-card-body flush">
              {obras.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Nenhuma obra vinculada.
                </div>
              ) : (
                <div className="detail-list">
                  {obras.map((o) => (
                    <Link
                      href={`/obras/${o.id_obra}`}
                      className="detail-list-item"
                      key={o.id}
                    >
                      <div className="li-main">
                        <div className="li-title">
                          <a>{o.nome}</a>
                        </div>
                        <div className="li-sub">
                          <span>{o.id}</span>
                          <span>·</span>
                          <ObraStatusBadge s={o.status} />
                          <span>·</span>
                          <Icon name="calendar" />
                          {o.inicio} → {o.fim}
                          {o.responsavel !== "—" ? (
                            <>
                              <span>·</span>
                              <Icon name="users" />
                              {o.responsavel}
                            </>
                          ) : null}
                        </div>
                        <div className="detail-progress">
                          <div className="detail-progress-bar">
                            <span style={{ width: o.progresso + "%" }} />
                          </div>
                          <span className="detail-progress-pct">
                            {o.progresso}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div className="detail-card">
            <div className="detail-card-head">
              <h3>Dados cadastrais</h3>
              <button
                type="button"
                className="icon-btn"
                title="Editar"
                onClick={() => setFormOpen(true)}
              >
                <Icon name="edit" />
              </button>
            </div>
            <div className="detail-card-body flush">
              <div className="quick-info">
                {cliente.cpf_cnpj ? (
                  <div className="quick-info-row">
                    <div className="lbl">{tipo === "PJ" ? "CNPJ" : "CPF"}</div>
                    <div className="val mono">
                      {formatCPFCNPJ(cliente.cpf_cnpj)}
                    </div>
                  </div>
                ) : null}
                {cliente.email ? (
                  <div className="quick-info-row">
                    <div className="lbl">E-mail</div>
                    <div className="val">{cliente.email}</div>
                  </div>
                ) : null}
                {cliente.telefone ? (
                  <div className="quick-info-row">
                    <div className="lbl">Telefone</div>
                    <div className="val mono">
                      {formatPhone(cliente.telefone)}
                    </div>
                  </div>
                ) : null}
                {cliente.endereco ? (
                  <div className="quick-info-row">
                    <div className="lbl">Endereço</div>
                    <div className="val">{cliente.endereco}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {cliente.observacoes ? (
            <div className="detail-card">
              <div className="detail-card-head">
                <h3>Observações</h3>
              </div>
              <div className="detail-card-body">
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--ink-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {cliente.observacoes}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ClienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={cliente}
        onSuccess={load}
      />
    </>
  )
}

void OBRA_STATUS
void fmtBRLfull
