"use client"

// Port literal de granum-design/trabalhador-perfil-app.jsx + TrabalhadorPerfil.html

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { TrabalhadorForm } from "@/components/forms/trabalhador-form"
import { Icon } from "@/components/granum/icon"
import {
  CONTRATO_STATUS,
  ESPECIALIDADE,
  TIPO_PAGAMENTO,
  TIPO_VINCULO,
} from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatBRL, formatCPF, formatDate } from "@/lib/utils/format"

interface Trabalhador {
  id_trabalhador: number
  nome: string
  cpf: string | null
  telefone: string | null
  especialidade: string | null
  tipo_vinculo: string | null
  pix_chave: string | null
  observacoes: string | null
  ativo: boolean | null
}

interface Contrato {
  id_contrato: number
  id_obra: number
  obra_nome: string
  tipo_pagamento: string
  valor_acordado: number
  data_inicio: string
  data_fim: string | null
  status: string
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function TrabalhadorPerfilPage() {
  const params = useParams()
  const [trab, setTrab] = useState<Trabalhador | null>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)
    const { data: t } = await supabase
      .from("trabalhador")
      .select("*")
      .eq("id_trabalhador", id)
      .single()
    setTrab(t as Trabalhador | null)

    const { data: cts } = await supabase
      .from("contrato_trabalho")
      .select("*")
      .eq("id_trabalhador", id)
      .order("data_inicio", { ascending: false })

    const list = (cts ?? []) as (Contrato & { id_obra: number })[]
    const obraIds = Array.from(new Set(list.map((c) => c.id_obra)))
    const { data: obras } = obraIds.length
      ? await supabase
          .from("obra")
          .select("id_obra, nome")
          .in("id_obra", obraIds)
      : { data: [] as { id_obra: number; nome: string }[] }
    const obraMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.nome as string])
    )

    setContratos(
      list.map((c) => ({
        ...c,
        obra_nome: obraMap.get(c.id_obra) ?? "",
      }))
    )
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!trab) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Carregando trabalhador…
      </div>
    )
  }

  const code = `TRB-${String(trab.id_trabalhador).padStart(4, "0")}`
  const espLabel =
    (ESPECIALIDADE as Record<string, string>)[trab.especialidade ?? ""] ??
    trab.especialidade ??
    "—"
  const vincLabel =
    (TIPO_VINCULO as Record<string, string>)[trab.tipo_vinculo ?? ""] ??
    trab.tipo_vinculo ??
    "—"
  const ativos = contratos.filter((c) => c.status === "ativo").length
  const obrasUnicas = new Set(contratos.map((c) => c.id_obra)).size
  const ultimoContrato = contratos[0]

  return (
    <>
      <div className="profile-head">
        <div className="profile-avatar">{getInitials(trab.nome)}</div>
        <div className="profile-head-info">
          <div className="obra-id">
            {code} · {espLabel}
          </div>
          <h1>{trab.nome}</h1>
          <div className="badges">
            {trab.ativo === false ? (
              <span className="badge dot badge-neutral">Inativo</span>
            ) : (
              <span className="badge dot badge-success">Ativo</span>
            )}
            <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
              {vincLabel}
            </span>
            {ativos > 0 ? (
              <>
                <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                  ·
                </span>
                <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                  {ativos} contrato{ativos > 1 ? "s" : ""} ativo
                  {ativos > 1 ? "s" : ""}
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
          <Link href="/trabalhadores" className="btn btn-secondary">
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
                <div className="sub">Histórico de contratos do trabalhador</div>
              </div>
            </div>
            <div className="detail-stats">
              <div className="detail-stat">
                <div className="lbl">Contratos</div>
                <div className="val">{contratos.length}</div>
                <div className="sub">{ativos} ativo{ativos !== 1 ? "s" : ""}</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Obras</div>
                <div className="val">{obrasUnicas}</div>
                <div className="sub">Distintas</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Último valor</div>
                <div className="val">
                  {ultimoContrato ? formatBRL(ultimoContrato.valor_acordado) : "—"}
                </div>
                <div className="sub">
                  {ultimoContrato
                    ? (TIPO_PAGAMENTO as Record<string, string>)[
                        ultimoContrato.tipo_pagamento
                      ] ?? ultimoContrato.tipo_pagamento
                    : ""}
                </div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Vínculo</div>
                <div className="val" style={{ fontSize: 16 }}>
                  {vincLabel}
                </div>
                <div className="sub">Tipo</div>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h3>Histórico de contratos</h3>
              </div>
            </div>
            <div className="detail-card-body flush">
              {contratos.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Nenhum contrato.
                </div>
              ) : (
                <div className="detail-list">
                  {contratos.map((c) => {
                    const statusMeta =
                      CONTRATO_STATUS[
                        c.status as keyof typeof CONTRATO_STATUS
                      ] as { label: string } | undefined
                    return (
                      <Link
                        href={`/obras/${c.id_obra}`}
                        className="detail-list-item"
                        key={c.id_contrato}
                      >
                        <div className="li-main">
                          <div className="li-title">
                            <a>{c.obra_nome || "Obra"}</a>
                          </div>
                          <div className="li-sub">
                            <Icon name="calendar" />
                            {formatDate(c.data_inicio)}
                            {c.data_fim ? ` → ${formatDate(c.data_fim)}` : ""}
                            <span>·</span>
                            <span>
                              {(TIPO_PAGAMENTO as Record<string, string>)[
                                c.tipo_pagamento
                              ] ?? c.tipo_pagamento}
                            </span>
                          </div>
                        </div>
                        <div
                          className="li-right"
                          style={{
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <div className="li-amount">
                            {formatBRL(c.valor_acordado)}
                          </div>
                          <div className="li-amount-sub">
                            {statusMeta?.label ?? c.status}
                          </div>
                        </div>
                      </Link>
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
                {trab.cpf ? (
                  <div className="quick-info-row">
                    <div className="lbl">CPF</div>
                    <div className="val mono">{formatCPF(trab.cpf)}</div>
                  </div>
                ) : null}
                {trab.telefone ? (
                  <div className="quick-info-row">
                    <div className="lbl">Telefone</div>
                    <div className="val mono">{trab.telefone}</div>
                  </div>
                ) : null}
                <div className="quick-info-row">
                  <div className="lbl">Especialidade</div>
                  <div className="val">{espLabel}</div>
                </div>
                <div className="quick-info-row">
                  <div className="lbl">Vínculo</div>
                  <div className="val">{vincLabel}</div>
                </div>
                {trab.pix_chave ? (
                  <div className="quick-info-row">
                    <div className="lbl">PIX</div>
                    <div className="val mono">{trab.pix_chave}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {trab.observacoes ? (
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
                  {trab.observacoes}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <TrabalhadorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        trabalhador={trab as unknown as Record<string, unknown>}
        onSuccess={load}
      />
    </>
  )
}
