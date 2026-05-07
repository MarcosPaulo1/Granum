"use client"

// Port literal de granum-design/responsavel-perfil-app.jsx + ResponsavelPerfil.html

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { ResponsavelForm } from "@/components/forms/responsavel-form"
import { Icon } from "@/components/granum/icon"
import { ROLES, TAREFA_STATUS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Responsavel = Database["public"]["Tables"]["responsavel"]["Row"]

interface ObraRow {
  id: string
  rawId: number
  nome: string
  status: string
}
interface TarefaRow {
  id: number
  nome: string
  status: string
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const STATUS_OBRA_META: Record<
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

function ObraStatusBadge({ s }: { s: string }) {
  const m = STATUS_OBRA_META[s] ?? STATUS_OBRA_META.planejamento
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

export default function ResponsavelPerfilPage() {
  const params = useParams()
  const [responsavel, setResponsavel] = useState<Responsavel | null>(null)
  const [perfilCodigo, setPerfilCodigo] = useState<string>("")
  const [obras, setObras] = useState<ObraRow[]>([])
  const [tarefas, setTarefas] = useState<TarefaRow[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)
    const { data: r } = await supabase
      .from("responsavel")
      .select("*")
      .eq("id_responsavel", id)
      .single()
    setResponsavel(r as Responsavel | null)

    if (r) {
      const { data: p } = await supabase
        .from("perfil")
        .select("nome")
        .eq("id_perfil", r.id_perfil)
        .single()
      setPerfilCodigo((p as { nome: string } | null)?.nome ?? "")
    }

    const { data: o } = await supabase
      .from("obra")
      .select("id_obra, nome, status")
      .eq("id_responsavel", id)
    setObras(
      (o ?? []).map((x) => ({
        id: `OBR-${String(x.id_obra).padStart(4, "0")}`,
        rawId: x.id_obra,
        nome: x.nome,
        status: x.status ?? "planejamento",
      }))
    )

    const { data: t } = await supabase
      .from("tarefa")
      .select("id_tarefa, nome, status")
      .eq("id_responsavel", id)
      .limit(20)
    setTarefas(
      (t ?? []).map((x) => ({
        id: x.id_tarefa,
        nome: x.nome,
        status: x.status ?? "pendente",
      }))
    )
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!responsavel) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Carregando responsável…
      </div>
    )
  }

  const code = `RSP-${String(responsavel.id_responsavel).padStart(3, "0")}`
  const perfilLabel =
    (ROLES as Record<string, string>)[perfilCodigo] ?? perfilCodigo
  const tarefasAtivas = tarefas.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelada"
  ).length

  return (
    <>
      <div className="profile-head">
        <div className="profile-avatar">{getInitials(responsavel.nome)}</div>
        <div className="profile-head-info">
          <div className="obra-id">
            {code} · {perfilLabel}
          </div>
          <h1>{responsavel.nome}</h1>
          <div className="badges">
            {responsavel.ativo === false ? (
              <span className="badge dot badge-neutral">Inativo</span>
            ) : (
              <span className="badge dot badge-success">Ativo</span>
            )}
            {responsavel.cargo ? (
              <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                {responsavel.cargo}
              </span>
            ) : null}
            {responsavel.departamento ? (
              <>
                <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                  ·
                </span>
                <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                  {responsavel.departamento}
                </span>
              </>
            ) : null}
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
          <Link href="/responsaveis" className="btn btn-secondary">
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
                  Obras supervisionadas e tarefas atribuídas
                </div>
              </div>
            </div>
            <div className="detail-stats">
              <div className="detail-stat">
                <div className="lbl">Obras</div>
                <div className="val">{obras.length}</div>
                <div className="sub">Vinculadas</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Tarefas</div>
                <div className="val">{tarefas.length}</div>
                <div className="sub">{tarefasAtivas} em aberto</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Perfil</div>
                <div className="val" style={{ fontSize: 18 }}>
                  {perfilLabel}
                </div>
                <div className="sub">Permissão</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Admissão</div>
                <div className="val mono" style={{ fontSize: 16 }}>
                  {responsavel.data_admissao
                    ? formatDate(responsavel.data_admissao)
                    : "—"}
                </div>
                <div className="sub">Data de entrada</div>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h3>Obras vinculadas</h3>
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
                  Nenhuma obra atribuída.
                </div>
              ) : (
                <div className="detail-list">
                  {obras.map((o) => (
                    <Link
                      href={`/obras/${o.rawId}`}
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
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h3>Tarefas atribuídas</h3>
              </div>
            </div>
            <div className="detail-card-body flush">
              {tarefas.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Nenhuma tarefa.
                </div>
              ) : (
                <div className="detail-list">
                  {tarefas.map((t) => {
                    const meta = TAREFA_STATUS[
                      t.status as keyof typeof TAREFA_STATUS
                    ] as { label: string } | undefined
                    return (
                      <div className="detail-list-item" key={t.id}>
                        <div className="li-main">
                          <div className="li-title">
                            <a>{t.nome}</a>
                          </div>
                          <div className="li-sub">
                            <span>{meta?.label ?? t.status}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                {responsavel.email ? (
                  <div className="quick-info-row">
                    <div className="lbl">E-mail</div>
                    <div className="val">{responsavel.email}</div>
                  </div>
                ) : null}
                {responsavel.telefone ? (
                  <div className="quick-info-row">
                    <div className="lbl">Telefone</div>
                    <div className="val mono">{responsavel.telefone}</div>
                  </div>
                ) : null}
                {responsavel.cargo ? (
                  <div className="quick-info-row">
                    <div className="lbl">Cargo</div>
                    <div className="val">{responsavel.cargo}</div>
                  </div>
                ) : null}
                {responsavel.departamento ? (
                  <div className="quick-info-row">
                    <div className="lbl">Depto</div>
                    <div className="val">{responsavel.departamento}</div>
                  </div>
                ) : null}
                <div className="quick-info-row">
                  <div className="lbl">Perfil</div>
                  <div className="val">{perfilLabel}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ResponsavelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        responsavel={responsavel}
        onSuccess={load}
      />
    </>
  )
}
