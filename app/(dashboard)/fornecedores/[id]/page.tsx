"use client"

// Port literal de granum-design/fornecedor-perfil-app.jsx + FornecedorPerfil.html

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { FornecedorForm } from "@/components/forms/fornecedor-form"
import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"
import { formatCNPJ, formatDate } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Fornecedor = Database["public"]["Tables"]["fornecedor"]["Row"]

interface LancRow {
  id: string
  hist: string
  data: string
  obra: string
  valor: number
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

export default function FornecedorPerfilPage() {
  const params = useParams()
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [lancs, setLancs] = useState<LancRow[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)
    const { data: f } = await supabase
      .from("fornecedor")
      .select("*")
      .eq("id_fornecedor", id)
      .single()
    setFornecedor(f)

    const { data: lanc } = await supabase
      .from("lancamento")
      .select("id_lancamento, data_competencia, historico, valor, id_obra")
      .eq("id_fornecedor", id)
      .eq("tipo", "realizado")
      .order("data_competencia", { ascending: false })

    const obraIds = Array.from(new Set((lanc ?? []).map((l) => l.id_obra)))
    const { data: obras } = obraIds.length
      ? await supabase
          .from("obra")
          .select("id_obra, nome")
          .in("id_obra", obraIds)
      : { data: [] as { id_obra: number; nome: string }[] }
    const obraMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.nome as string])
    )

    setLancs(
      (lanc ?? []).map((l) => ({
        id: `LN-${String(l.id_lancamento).padStart(4, "0")}`,
        hist: l.historico ?? "(sem descrição)",
        data: formatDate(l.data_competencia),
        obra: obraMap.get(l.id_obra) ?? "",
        valor: Number(l.valor),
      }))
    )
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!fornecedor) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Carregando fornecedor…
      </div>
    )
  }

  const totalPago = lancs.reduce((a, l) => a + l.valor, 0)
  const code = `FOR-${String(fornecedor.id_fornecedor).padStart(4, "0")}`

  return (
    <>
      <div className="profile-head">
        <div className="profile-avatar tone-pj">
          {getInitials(fornecedor.nome)}
        </div>
        <div className="profile-head-info">
          <div className="obra-id">
            {code} · {fornecedor.tipo ?? "Fornecedor"}
          </div>
          <h1>{fornecedor.nome}</h1>
          <div className="badges">
            {fornecedor.ativo === false ? (
              <span className="badge dot badge-neutral">Inativo</span>
            ) : (
              <span className="badge dot badge-success">Ativo</span>
            )}
            <span style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
              {lancs.length} lançamentos · {fmtBRL(totalPago)} pago
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
          <Link href="/fornecedores" className="btn btn-secondary">
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
                <h3>Resumo financeiro</h3>
                <div className="sub">Pagamentos realizados ao fornecedor</div>
              </div>
            </div>
            <div className="detail-stats">
              <div className="detail-stat">
                <div className="lbl">Total pago</div>
                <div className="val fin-pos">{fmtBRL(totalPago)}</div>
                <div className="sub">{lancs.length} lançamentos</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Ticket médio</div>
                <div className="val">
                  {fmtBRL(
                    lancs.length > 0 ? Math.round(totalPago / lancs.length) : 0
                  )}
                </div>
                <div className="sub">Por lançamento</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Obras atendidas</div>
                <div className="val">
                  {new Set(lancs.map((l) => l.obra).filter(Boolean)).size}
                </div>
                <div className="sub">Distintas</div>
              </div>
              <div className="detail-stat">
                <div className="lbl">Pendente</div>
                <div className="val">—</div>
                <div className="sub">Em desenvolvimento</div>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <div className="detail-card-head">
              <div>
                <h3>Lançamentos do fornecedor</h3>
                <div className="sub">
                  Últimas movimentações registradas
                </div>
              </div>
            </div>
            <div className="detail-card-body flush">
              {lancs.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Nenhum lançamento.
                </div>
              ) : (
                <div className="detail-list">
                  {lancs.map((l) => (
                    <div className="detail-list-item" key={l.id}>
                      <div className="li-main">
                        <div className="li-title">
                          <a>{l.hist}</a>
                        </div>
                        <div className="li-sub">
                          <Icon name="calendar" />
                          {l.data}
                          {l.obra ? (
                            <>
                              <span>·</span>
                              <Icon name="building" />
                              {l.obra}
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div
                        className="li-right"
                        style={{
                          flexDirection: "column",
                          alignItems: "flex-end",
                        }}
                      >
                        <div className="li-amount fin-neg">
                          − {fmtBRLfull(l.valor)}
                        </div>
                        <div className="li-amount-sub">Saída · realizado</div>
                      </div>
                    </div>
                  ))}
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
                {fornecedor.cnpj ? (
                  <div className="quick-info-row">
                    <div className="lbl">CNPJ</div>
                    <div className="val mono">{formatCNPJ(fornecedor.cnpj)}</div>
                  </div>
                ) : null}
                {fornecedor.tipo ? (
                  <div className="quick-info-row">
                    <div className="lbl">Tipo</div>
                    <div className="val">{fornecedor.tipo}</div>
                  </div>
                ) : null}
                {fornecedor.contato ? (
                  <div className="quick-info-row">
                    <div className="lbl">Contato</div>
                    <div className="val">{fornecedor.contato}</div>
                  </div>
                ) : null}
                {fornecedor.email ? (
                  <div className="quick-info-row">
                    <div className="lbl">E-mail</div>
                    <div className="val">{fornecedor.email}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {fornecedor.observacoes ? (
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
                  {fornecedor.observacoes}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <FornecedorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        fornecedor={fornecedor}
        onSuccess={load}
      />
    </>
  )
}
