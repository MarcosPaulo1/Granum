"use client"

// Port literal de granum-design/clientes-app.jsx + Clientes.html
// Estrutura de className preservada; mocks substituidos por queries Supabase

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ClienteForm } from "@/components/forms/cliente-form"
import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"
import { formatCPFCNPJ } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Cliente = Database["public"]["Tables"]["cliente"]["Row"]

interface ObraResumo {
  id: number
  nome: string
  status: string | null
}

interface ClienteRow {
  id: string
  rawId: number
  nome: string
  init: string
  tipo: "PF" | "PJ"
  doc: string
  contato: string
  fone: string
  cidade: string
  obras: ObraResumo[]
  totalObras: number
  ativas: number
  faturado: number
  ultima: string
  status: "ativo" | "inativo" | "prospecto"
}

const ACTIVE_OBRA_STATUSES = new Set(["em_andamento", "planejamento"])

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
  if (v >= 1000) return "R$ " + Math.round(v / 1000).toLocaleString("pt-BR") + " mil"
  return "R$ " + v.toLocaleString("pt-BR")
}

function StatusBadge({ s }: { s: ClienteRow["status"] }) {
  const map = {
    ativo: { cls: "badge-success", label: "Ativo" },
    inativo: { cls: "badge-neutral", label: "Inativo" },
    prospecto: { cls: "badge-warn", label: "Prospecto" },
  } as const
  const m = map[s] ?? map.inativo
  return <span className={"badge dot " + m.cls}>{m.label}</span>
}

function ObraStatusDot({ s }: { s: string | null }) {
  const color =
    s === "em_andamento"
      ? "var(--info)"
      : s === "planejamento"
        ? "var(--ink-soft)"
        : s === "pausada"
          ? "var(--warning)"
          : s === "concluida"
            ? "var(--success)"
            : s === "cancelada"
              ? "var(--danger)"
              : "var(--ink-soft)"
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        marginRight: 6,
        verticalAlign: 2,
      }}
    />
  )
}

function deriveStatus(c: ClienteRow): ClienteRow["status"] {
  if (c.ativas > 0) return "ativo"
  if (c.totalObras === 0) return "prospecto"
  return "inativo"
}

export default function ClientesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<ClienteRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "PF" | "PJ">("todos")
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativo" | "inativo" | "prospecto"
  >("todos")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: clientes, error } = await supabase
      .from("cliente")
      .select("*")
      .order("nome")

    if (error) {
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }

    const ids = (clientes ?? []).map((c) => c.id_cliente)
    const obrasPorCliente = new Map<number, ObraResumo[]>()
    if (ids.length > 0) {
      const { data: obras } = await supabase
        .from("obra")
        .select("id_obra, nome, status, id_cliente")
        .in("id_cliente", ids)
      for (const o of obras ?? []) {
        const arr = obrasPorCliente.get(o.id_cliente) ?? []
        arr.push({ id: o.id_obra, nome: o.nome, status: o.status })
        obrasPorCliente.set(o.id_cliente, arr)
      }
    }

    const enriched: ClienteRow[] = (clientes ?? []).map((c: Cliente) => {
      const obras = obrasPorCliente.get(c.id_cliente) ?? []
      const ativas = obras.filter((o) =>
        ACTIVE_OBRA_STATUSES.has(o.status ?? "")
      ).length
      const row: ClienteRow = {
        id: `CLI-${String(c.id_cliente).padStart(4, "0")}`,
        rawId: c.id_cliente,
        nome: c.nome,
        init: getInitials(c.nome),
        tipo: detectTipo(c.cpf_cnpj),
        doc: c.cpf_cnpj ? formatCPFCNPJ(c.cpf_cnpj) : "—",
        contato: c.email ?? "",
        fone: c.telefone ?? "",
        cidade: c.endereco ?? "",
        obras,
        totalObras: obras.length,
        ativas,
        faturado: 0,
        ultima: "—",
        status: "ativo",
      }
      row.status = deriveStatus(row)
      return row
    })

    setRows(enriched)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      rows.filter((c) => {
        if (filtroTipo !== "todos" && c.tipo !== filtroTipo) return false
        if (filtroStatus !== "todos" && c.status !== filtroStatus) return false
        if (
          busca &&
          !(c.nome + c.doc + c.contato).toLowerCase().includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [rows, filtroTipo, filtroStatus, busca]
  )

  const totalFaturado = rows.reduce((a, c) => a + c.faturado, 0)
  const ativos = rows.filter((c) => c.status === "ativo").length
  const prospectos = rows.filter((c) => c.status === "prospecto").length
  const comObraAtiva = rows.filter((c) => c.ativas > 0).length
  const comFaturado = rows.filter((c) => c.faturado > 0).length

  return (
    <>
      {/* Page head */}
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Cadastros</div>
            <h1>Clientes</h1>
            <div className="subtitle">
              {rows.length} clientes cadastrados · {comObraAtiva} com obras
              ativas
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
              Novo cliente
            </button>
          </div>
        </div>
      </div>

      {/* KPIs compactos */}
      <div className="list-kpis">
        <div className="list-kpi">
          <div className="list-kpi-label">Total de clientes</div>
          <div className="list-kpi-value">{rows.length}</div>
          <div className="list-kpi-sub">
            <Icon name="users" />
            {ativos} ativos · {prospectos} prospectos
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Com obra ativa</div>
          <div className="list-kpi-value">{comObraAtiva}</div>
          <div className="list-kpi-sub">
            <Icon name="building" />
            {rows.reduce((a, c) => a + c.ativas, 0)} obras em execução
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Faturado (12 meses)</div>
          <div
            className={
              "list-kpi-value " + (totalFaturado > 0 ? "fin-pos" : "fin-neg")
            }
          >
            {fmtBRL(totalFaturado)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="dollar" />
            Soma de todas as obras
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Ticket médio</div>
          <div
            className={
              "list-kpi-value " + (totalFaturado > 0 ? "fin-pos" : "fin-neg")
            }
          >
            {fmtBRL(comFaturado > 0 ? Math.round(totalFaturado / comFaturado) : 0)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="chart" />
            Por cliente com obra
          </div>
        </div>
      </div>

      {/* Toolbar + tabela */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ/CPF ou e-mail…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <div className="seg">
              {(["todos", "PF", "PJ"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={"seg-btn" + (filtroTipo === t ? " active" : "")}
                  onClick={() => setFiltroTipo(t)}
                >
                  {t === "todos" ? "Todos" : t}
                </button>
              ))}
            </div>
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "ativo", label: "Ativos" },
                  { id: "prospecto", label: "Prospectos" },
                  { id: "inativo", label: "Inativos" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={
                    "seg-btn" + (filtroStatus === t.id ? " active" : "")
                  }
                  onClick={() => setFiltroStatus(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="list-table">
          <div className="list-thead">
            <div>Cliente</div>
            <div>Documento</div>
            <div>Contato</div>
            <div>Obras</div>
            <div className="num">Faturado</div>
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
                ? "Nenhum cliente cadastrado ainda."
                : "Nenhum cliente encontrado com esses filtros."}
            </div>
          ) : (
            filtered.map((c) => (
              <div
                className="list-row2"
                key={c.id}
                onClick={() => router.push(`/clientes/${c.rawId}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="list-cell-name">
                  <span
                    className={
                      "avatar-sm " + (c.tipo === "PJ" ? "avatar-pj" : "")
                    }
                  >
                    {c.init}
                  </span>
                  <div className="list-name-block">
                    <div className="nm">
                      <a>{c.nome}</a>
                    </div>
                    <div className="sub">
                      {c.id}
                      {c.cidade ? ` · ${c.cidade}` : ""}
                    </div>
                  </div>
                </div>
                <div className="list-cell-doc">
                  <div className="tipo-tag">{c.tipo}</div>
                  <div className="mono">{c.doc}</div>
                </div>
                <div className="list-cell-contact">
                  <div className="em">{c.contato || "—"}</div>
                  {c.fone ? <div className="sub mono">{c.fone}</div> : null}
                </div>
                <div className="list-cell-obras">
                  {c.obras.length === 0 ? (
                    <span className="sub">—</span>
                  ) : (
                    <>
                      <div className="ob-main">
                        <ObraStatusDot s={c.obras[0].status} />
                        {c.obras[0].nome}
                      </div>
                      {c.totalObras > 1 ? (
                        <div className="sub">
                          + {c.totalObras - 1} outra
                          {c.totalObras - 1 > 1 ? "s" : ""} · {c.ativas} ativa
                          {c.ativas !== 1 ? "s" : ""}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
                <div className="list-cell-num">
                  <div
                    className={
                      "val mono " + (c.faturado > 0 ? "fin-pos" : "fin-neg")
                    }
                  >
                    {fmtBRL(c.faturado)}
                  </div>
                  <div className="sub">últ. {c.ultima}</div>
                </div>
                <div className="list-cell-status">
                  <StatusBadge s={c.status} />
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
            Mostrando {filtered.length} de {rows.length} clientes
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

      <ClienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </>
  )
}
