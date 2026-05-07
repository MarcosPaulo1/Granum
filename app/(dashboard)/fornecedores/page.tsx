"use client"

// Port literal de granum-design/fornecedores-app.jsx + Fornecedores.html

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { FornecedorForm } from "@/components/forms/fornecedor-form"
import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"
import { formatCNPJ } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Fornecedor = Database["public"]["Tables"]["fornecedor"]["Row"]

type TipoChave = "material" | "servico" | "locacao" | "outro"

interface FornRow {
  id: string
  rawId: number
  nome: string
  init: string
  tipo: TipoChave
  doc: string
  contato: string
  email: string
  fone: string
  cidade: string
  obras: number
  pago: number
  pendente: number
  ultima: string
  status: "ativo" | "inativo"
}

const TIPO_META: Record<
  TipoChave,
  { label: string; bg: string; fg: string }
> = {
  material: {
    label: "Material",
    bg: "color-mix(in oklab, var(--info) 18%, var(--surface-muted))",
    fg: "var(--info-ink)",
  },
  servico: {
    label: "Serviço",
    bg: "color-mix(in oklab, var(--primary) 18%, var(--surface-muted))",
    fg: "var(--primary)",
  },
  locacao: {
    label: "Locação",
    bg: "color-mix(in oklab, var(--warning) 22%, var(--surface-muted))",
    fg: "var(--warning-ink)",
  },
  outro: {
    label: "Outro",
    bg: "var(--surface-muted)",
    fg: "var(--ink-muted)",
  },
}

function normalizeTipo(t: string | null): TipoChave {
  if (!t) return "outro"
  const n = t.toLowerCase().replace(/[ç]/g, "c").trim()
  if (n.startsWith("mat")) return "material"
  if (n.startsWith("serv")) return "servico"
  if (n.startsWith("loc")) return "locacao"
  return "outro"
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

function TipoBadge({ t }: { t: TipoChave }) {
  const m = TIPO_META[t]
  return (
    <span
      className="tipo-tag"
      style={{
        background: m.bg,
        color: m.fg,
        fontWeight: 500,
        fontSize: 11,
      }}
    >
      {m.label}
    </span>
  )
}

function StatusBadge({ s }: { s: FornRow["status"] }) {
  return s === "ativo" ? (
    <span className="badge dot badge-success">Ativo</span>
  ) : (
    <span className="badge dot badge-neutral">Inativo</span>
  )
}

export default function FornecedoresPage() {
  const router = useRouter()
  const [rows, setRows] = useState<FornRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fTipo, setFTipo] = useState<"todos" | TipoChave>("todos")
  const [fStatus, setFStatus] = useState<"todos" | "ativo" | "inativo">(
    "todos"
  )
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("fornecedor")
      .select("*")
      .order("nome")
    if (error) {
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }
    setRows(
      (data ?? []).map((f: Fornecedor) => ({
        id: `FOR-${String(f.id_fornecedor).padStart(4, "0")}`,
        rawId: f.id_fornecedor,
        nome: f.nome,
        init: getInitials(f.nome),
        tipo: normalizeTipo(f.tipo),
        doc: f.cnpj ? formatCNPJ(f.cnpj) : "—",
        contato: f.contato ?? "",
        email: f.email ?? "",
        fone: "",
        cidade: "",
        obras: 0,
        pago: 0,
        pendente: 0,
        ultima: "—",
        status: f.ativo === false ? "inativo" : "ativo",
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      rows.filter((f) => {
        if (fTipo !== "todos" && f.tipo !== fTipo) return false
        if (fStatus !== "todos" && f.status !== fStatus) return false
        if (
          busca &&
          !(f.nome + f.doc + f.email).toLowerCase().includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [rows, fTipo, fStatus, busca]
  )

  const totalPago = rows.reduce((a, f) => a + f.pago, 0)
  const totalPend = rows.reduce((a, f) => a + f.pendente, 0)
  const ativos = rows.filter((f) => f.status === "ativo").length
  const comPago = rows.filter((f) => f.pago > 0).length

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Cadastros</div>
            <h1>Fornecedores</h1>
            <div className="subtitle">
              {rows.length} fornecedores cadastrados · {ativos} ativos
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="upload" />
              Importar
            </button>
            <button className="btn btn-secondary" type="button" disabled>
              <Icon name="download" />
              Exportar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setFormOpen(true)}
            >
              <Icon name="plus" />
              Novo fornecedor
            </button>
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi">
          <div className="list-kpi-label">Total de fornecedores</div>
          <div className="list-kpi-value">{rows.length}</div>
          <div className="list-kpi-sub">
            <Icon name="truck" />
            {ativos} ativos · {rows.length - ativos} inativos
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Pago (12 meses)</div>
          <div className="list-kpi-value fin-pos">{fmtBRL(totalPago)}</div>
          <div className="list-kpi-sub">
            <Icon name="dollar" />
            Soma de todos os pagamentos
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Pendente</div>
          <div
            className={
              "list-kpi-value " + (totalPend > 0 ? "fin-neg" : "fin-pos")
            }
          >
            {fmtBRL(totalPend)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="clock" />A pagar em até 30 dias
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Ticket médio</div>
          <div className="list-kpi-value fin-pos">
            {fmtBRL(comPago > 0 ? Math.round(totalPago / comPago) : 0)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="chart" />
            Por fornecedor ativo
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ ou e-mail…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "material", label: "Material" },
                  { id: "servico", label: "Serviço" },
                  { id: "locacao", label: "Locação" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"seg-btn" + (fTipo === t.id ? " active" : "")}
                  onClick={() => setFTipo(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "ativo", label: "Ativos" },
                  { id: "inativo", label: "Inativos" },
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

        <div className="list-table">
          <div className="list-thead">
            <div>Fornecedor</div>
            <div>Documento</div>
            <div>Contato</div>
            <div>Tipo</div>
            <div className="num">Pago · Pendente</div>
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
              {rows.length === 0
                ? "Nenhum fornecedor cadastrado ainda."
                : "Nenhum fornecedor encontrado com esses filtros."}
            </div>
          ) : (
            filtered.map((f) => (
              <div
                className="list-row2"
                key={f.id}
                onClick={() => router.push(`/fornecedores/${f.rawId}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="list-cell-name">
                  <span className="avatar-sm avatar-pj">{f.init}</span>
                  <div className="list-name-block">
                    <div className="nm">
                      <a>{f.nome}</a>
                    </div>
                    <div className="sub">{f.id}</div>
                  </div>
                </div>
                <div className="list-cell-doc">
                  <div className="tipo-tag">CNPJ</div>
                  <div className="mono">{f.doc}</div>
                </div>
                <div className="list-cell-contact">
                  <div className="em">{f.contato || "—"}</div>
                  {f.email ? <div className="sub">{f.email}</div> : null}
                </div>
                <div>
                  <TipoBadge t={f.tipo} />
                  {f.obras > 0 ? (
                    <div className="sub" style={{ marginTop: 4 }}>
                      {f.obras} obra{f.obras !== 1 ? "s" : ""}
                    </div>
                  ) : null}
                </div>
                <div className="list-cell-num">
                  <div
                    className={
                      "val mono " + (f.pago > 0 ? "fin-pos" : "fin-neg")
                    }
                  >
                    {fmtBRL(f.pago)}
                  </div>
                  <div
                    className={"sub mono " + (f.pendente > 0 ? "fin-neg" : "")}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    pend. {fmtBRL(f.pendente)}
                  </div>
                </div>
                <div className="list-cell-status">
                  <StatusBadge s={f.status} />
                </div>
                <div className="list-cell-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Mais ações"
                  >
                    <Icon name="more" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="list-foot">
          <div className="sub">
            Mostrando {filtered.length} de {rows.length} fornecedores
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

      <FornecedorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </>
  )
}
