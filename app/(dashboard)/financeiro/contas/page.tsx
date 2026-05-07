"use client"

// Port literal de granum-design/contas-pagar-app.jsx + ContasPagar.html

import { useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface ContaRow {
  id: string
  rawId: number
  venc: string
  diff: number
  desc: string
  cat: string
  fornecedor: string
  doc: string
  obra: string
  valor: number
  forma: string
  status: "atrasado" | "hoje" | "proximo" | "futuro" | "pago"
}

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  Material: { bg: "var(--info-soft)", fg: "var(--info-ink)" },
  "Mão de obra": { bg: "var(--warning-soft)", fg: "var(--warning-ink)" },
  Serviços: { bg: "var(--warning-soft)", fg: "var(--warning-ink)" },
  Locação: { bg: "var(--warning-soft)", fg: "var(--warning-ink)" },
  Operação: { bg: "var(--surface-muted)", fg: "var(--ink)" },
  Tributos: {
    bg: "color-mix(in oklab, var(--danger) 14%, var(--surface-muted))",
    fg: "var(--danger-ink)",
  },
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

function VencPill({ c }: { c: ContaRow }) {
  if (c.status === "atrasado") {
    return (
      <div className="venc-pill atrasado">
        <Icon name="alertTriangle" />
        <div>
          <div className="primary">
            {Math.abs(c.diff)} dia{Math.abs(c.diff) > 1 ? "s" : ""} atrasado
          </div>
          <div className="sub mono">{c.venc}</div>
        </div>
      </div>
    )
  }
  if (c.status === "hoje") {
    return (
      <div className="venc-pill hoje">
        <Icon name="clock" />
        <div>
          <div className="primary">Vence hoje</div>
          <div className="sub mono">{c.venc}</div>
        </div>
      </div>
    )
  }
  if (c.status === "proximo") {
    return (
      <div className="venc-pill proximo">
        <Icon name="calendar" />
        <div>
          <div className="primary">
            Em {c.diff} dia{c.diff > 1 ? "s" : ""}
          </div>
          <div className="sub mono">{c.venc}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="venc-pill futuro">
      <Icon name="calendar" />
      <div>
        <div className="primary">Em {c.diff} dias</div>
        <div className="sub mono">{c.venc}</div>
      </div>
    </div>
  )
}

export default function ContasPage() {
  const [rows, setRows] = useState<ContaRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fJanela, setFJanela] = useState<
    "todas" | "atrasados" | "hoje" | "semana" | "mes"
  >("todas")
  const [fObra, setFObra] = useState<"todas" | string>("todas")
  const [fCat, setFCat] = useState<"todas" | string>("todas")
  const [busca, setBusca] = useState("")
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [pagandoIds, setPagandoIds] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("vw_contas_a_pagar")
      .select("*")
      .order("data_vencimento")

    if (error) {
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }

    setRows(
      (data ?? [])
        .filter((c) => c.status !== "pago")
        .map((c) => {
          const diff = c.dias_para_vencer ?? 0
          let status: ContaRow["status"] = "futuro"
          if (c.status_real === "atrasado" || diff < 0) status = "atrasado"
          else if (diff === 0) status = "hoje"
          else if (diff <= 7) status = "proximo"
          else status = "futuro"
          return {
            id: `CP-${String(c.id_parcela ?? 0).padStart(4, "0")}`,
            rawId: c.id_parcela ?? 0,
            venc: c.data_vencimento
              ? format(new Date(c.data_vencimento), "dd/MM/yyyy")
              : "—",
            diff,
            desc: c.historico ?? "(sem descrição)",
            cat: "Operação",
            fornecedor: c.fornecedor ?? "—",
            doc: c.cnpj ?? "",
            obra: c.obra ?? "—",
            valor: Number(c.valor ?? 0),
            forma: "boleto",
            status,
          }
        })
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () => Array.from(new Set(rows.map((c) => c.obra).filter(Boolean))).sort(),
    [rows]
  )
  const cats = useMemo(
    () => Array.from(new Set(rows.map((c) => c.cat).filter(Boolean))).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((c) => {
        if (fJanela === "atrasados" && c.status !== "atrasado") return false
        if (fJanela === "hoje" && c.status !== "hoje") return false
        if (fJanela === "semana" && !(c.diff >= 0 && c.diff <= 7)) return false
        if (fJanela === "mes" && !(c.diff >= 0 && c.diff <= 30)) return false
        if (fObra !== "todas" && c.obra !== fObra) return false
        if (fCat !== "todas" && c.cat !== fCat) return false
        if (
          busca &&
          !(c.desc + c.fornecedor + c.id + c.doc)
            .toLowerCase()
            .includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [rows, fJanela, fObra, fCat, busca]
  )

  const atrasado = rows
    .filter((c) => c.status === "atrasado")
    .reduce((a, c) => a + c.valor, 0)
  const hoje = rows
    .filter((c) => c.status === "hoje")
    .reduce((a, c) => a + c.valor, 0)
  const semana = rows
    .filter((c) => c.diff >= 0 && c.diff <= 7)
    .reduce((a, c) => a + c.valor, 0)
  const total30 = rows
    .filter((c) => c.diff <= 30)
    .reduce((a, c) => a + c.valor, 0)

  const toggle = (id: number) => {
    setSel((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }
  const toggleAll = () => {
    if (sel.size === filtered.length && filtered.length > 0)
      setSel(new Set())
    else setSel(new Set(filtered.map((c) => c.rawId)))
  }
  const selValor = filtered
    .filter((c) => sel.has(c.rawId))
    .reduce((a, c) => a + c.valor, 0)

  async function marcarPago(ids: number[]) {
    if (ids.length === 0) return
    setPagandoIds((p) => {
      const next = new Set(p)
      for (const id of ids) next.add(id)
      return next
    })
    const supabase = createClient()
    const today = format(new Date(), "yyyy-MM-dd")
    const { error } = await supabase
      .from("parcela")
      .update({ status: "pago", data_pagamento: today })
      .in("id_parcela", ids)
    setPagandoIds(new Set())
    if (error) {
      toast.error("Erro: " + error.message)
      return
    }
    toast.success(
      ids.length === 1 ? "Parcela paga" : `${ids.length} parcelas pagas`
    )
    setSel(new Set())
    load()
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">
              Financeiro · Referência {format(new Date(), "dd/MM/yyyy")}
            </div>
            <h1>Contas a pagar</h1>
            <div className="subtitle">
              {rows.length} contas em aberto · próximos 30 dias totalizam{" "}
              <strong style={{ color: "var(--ink)" }}>
                {fmtBRLk(total30)}
              </strong>
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="download" />
              Exportar
            </button>
            <button className="btn btn-primary" type="button" disabled>
              <Icon name="plus" />
              Nova conta
            </button>
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi tone-danger">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Atrasadas</div>
            <div className="kpi-icon">
              <Icon name="alertTriangle" />
            </div>
          </div>
          <div className="list-kpi-value fin-neg">{fmtBRLk(atrasado)}</div>
          <div className="list-kpi-sub">
            <Icon name="clock" />
            {rows.filter((c) => c.status === "atrasado").length} contas em
            atraso
          </div>
        </div>
        <div className="list-kpi tone-warning">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Vencem hoje</div>
            <div className="kpi-icon">
              <Icon name="clock" />
            </div>
          </div>
          <div className="list-kpi-value">{fmtBRLk(hoje)}</div>
          <div className="list-kpi-sub">
            <Icon name="calendar" />
            {rows.filter((c) => c.status === "hoje").length} para hoje
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Esta semana</div>
          <div className="list-kpi-value">{fmtBRLk(semana)}</div>
          <div className="list-kpi-sub">
            <Icon name="calendar" />
            Próximos 7 dias
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Total 30 dias</div>
          <div className="list-kpi-value">{fmtBRLk(total30)}</div>
          <div className="list-kpi-sub">
            <Icon name="trend" />
            Previsão de saída de caixa
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por descrição, fornecedor, NF…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <div className="seg">
              {(
                [
                  { id: "todas", label: "Todas" },
                  { id: "atrasados", label: "Atrasados" },
                  { id: "hoje", label: "Hoje" },
                  { id: "semana", label: "7 dias" },
                  { id: "mes", label: "30 dias" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"seg-btn" + (fJanela === t.id ? " active" : "")}
                  onClick={() => setFJanela(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
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
            <select
              className="seg-select"
              value={fCat}
              onChange={(e) => setFCat(e.target.value)}
            >
              <option value="todas">Todas categorias</option>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sel.size > 0 ? (
          <div className="bulk-bar">
            <div>
              <strong>{sel.size}</strong> conta{sel.size > 1 ? "s" : ""}{" "}
              selecionada{sel.size > 1 ? "s" : ""} ·{" "}
              <span
                className="mono"
                style={{ fontWeight: 500, color: "var(--ink)" }}
              >
                {fmtBRL(selValor)}
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
                Exportar remessa
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => marcarPago(Array.from(sel))}
                disabled={pagandoIds.size > 0}
              >
                <Icon name="check" />
                Marcar como pagas
              </button>
            </div>
          </div>
        ) : null}

        <div className="list-table list-table-cp">
          <div className="list-thead">
            <div>
              <input
                type="checkbox"
                checked={sel.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="list-check"
              />
            </div>
            <div>Vencimento</div>
            <div>Descrição</div>
            <div>Categoria · Obra</div>
            <div>Fornecedor · NF</div>
            <div className="num">Valor</div>
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
              Nenhuma conta encontrada com esses filtros.
            </div>
          ) : (
            filtered.map((c) => {
              const cat = CAT_COLORS[c.cat] ?? CAT_COLORS["Operação"]
              return (
                <div
                  className={
                    "list-row2" +
                    (c.status === "atrasado" ? " row-danger" : "") +
                    (sel.has(c.rawId) ? " row-selected" : "")
                  }
                  key={c.id}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={sel.has(c.rawId)}
                      onChange={() => toggle(c.rawId)}
                      className="list-check"
                    />
                  </div>
                  <div>
                    <VencPill c={c} />
                  </div>
                  <div className="list-name-block">
                    <div className="nm">
                      <a>{c.desc}</a>
                    </div>
                    <div className="sub mono">{c.id}</div>
                  </div>
                  <div>
                    <span
                      className="tipo-tag"
                      style={{
                        background: cat.bg,
                        color: cat.fg,
                        fontWeight: 500,
                        fontSize: 11,
                      }}
                    >
                      {c.cat}
                    </span>
                    <div className="sub" style={{ marginTop: 4 }}>
                      {c.obra}
                    </div>
                  </div>
                  <div className="list-cell-contact">
                    <div className="em" style={{ fontSize: 13 }}>
                      {c.fornecedor}
                    </div>
                    {c.doc ? (
                      <div className="sub mono">
                        {c.doc} · {c.forma === "pix" ? "PIX" : "Boleto"}
                      </div>
                    ) : null}
                  </div>
                  <div className="list-cell-num">
                    <div
                      className="val mono fin-neg"
                      style={{ fontSize: 14 }}
                    >
                      {fmtBRL(c.valor)}
                    </div>
                  </div>
                  <div
                    className="list-cell-actions"
                    style={{ display: "flex", gap: 4 }}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => marcarPago([c.rawId])}
                      disabled={pagandoIds.has(c.rawId)}
                    >
                      Pagar
                    </button>
                    <button type="button" className="icon-btn">
                      <Icon name="more" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="list-foot">
          <div className="sub">
            Mostrando {filtered.length} de {rows.length} contas · total
            selecionado{" "}
            <span
              className="mono"
              style={{ color: "var(--ink)", fontWeight: 500 }}
            >
              {fmtBRL(filtered.reduce((a, c) => a + c.valor, 0))}
            </span>
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
    </>
  )
}
