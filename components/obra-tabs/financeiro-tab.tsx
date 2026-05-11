"use client"

// Port literal: usa classNames do design (list-table, list-kpis, etc)

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"

import { LancamentoForm } from "@/components/forms/lancamento-form"
import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface LancRow {
  id: string
  rawId: number
  data: string
  tipo: "in" | "out"
  desc: string
  cat: string
  fornecedor: string
  valor: number
  status: "pago" | "pendente" | "atrasado"
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
  if (!v) return "R$ 0"
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000) return "R$ " + Math.round(v / 1000) + " mil"
  return "R$ " + v
}

function StatusBadge({ s }: { s: LancRow["status"] }) {
  const map = {
    pago: { cls: "badge-success", label: "Pago" },
    pendente: { cls: "badge-warning", label: "Pendente" },
    atrasado: { cls: "badge-danger", label: "Atrasado" },
  } as const
  const m = map[s]
  return <span className={"badge dot " + m.cls}>{m.label}</span>
}

interface FinanceiroTabProps {
  obraId: number
}

export function FinanceiroTab({ obraId }: FinanceiroTabProps) {
  const [rows, setRows] = useState<LancRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: lancs, error } = await supabase
      .from("lancamento")
      .select("*")
      .eq("id_obra", obraId)
      .order("data_competencia", { ascending: false })

    if (error) {
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }
    const list = lancs ?? []
    const fornIds = Array.from(
      new Set(list.filter((l) => l.id_fornecedor).map((l) => l.id_fornecedor!))
    )
    const ccIds = Array.from(new Set(list.map((l) => l.id_centro_custo)))
    const [{ data: forns }, { data: ccs }] = await Promise.all([
      fornIds.length
        ? supabase
            .from("fornecedor")
            .select("id_fornecedor, nome")
            .in("id_fornecedor", fornIds)
        : Promise.resolve({
            data: [] as { id_fornecedor: number; nome: string }[],
          }),
      ccIds.length
        ? supabase
            .from("centro_custo")
            .select("id_centro_custo, nome")
            .in("id_centro_custo", ccIds)
        : Promise.resolve({
            data: [] as { id_centro_custo: number; nome: string }[],
          }),
    ])
    const fornMap = new Map(
      (forns ?? []).map((f) => [f.id_fornecedor, f.nome as string])
    )
    const ccMap = new Map(
      (ccs ?? []).map((c) => [c.id_centro_custo, c.nome as string])
    )
    const today = format(new Date(), "yyyy-MM-dd")
    setRows(
      list.map((l) => ({
        id: `LN-${String(l.id_lancamento).padStart(4, "0")}`,
        rawId: l.id_lancamento,
        data: format(parseISO(l.data_competencia), "dd/MM/yyyy"),
        tipo: l.entrada_saida === "entrada" ? "in" : "out",
        desc: l.historico ?? "(sem descrição)",
        cat: ccMap.get(l.id_centro_custo) ?? "",
        fornecedor: l.id_fornecedor
          ? fornMap.get(l.id_fornecedor) ?? ""
          : "",
        valor: Number(l.valor),
        status: l.data_pagamento
          ? "pago"
          : l.data_competencia < today
            ? "atrasado"
            : "pendente",
      }))
    )
    setIsLoading(false)
  }, [obraId])

  useEffect(() => {
    load()
  }, [load])

  const entradas = rows
    .filter((l) => l.tipo === "in" && l.status === "pago")
    .reduce((a, l) => a + l.valor, 0)
  const saidas = rows
    .filter((l) => l.tipo === "out" && l.status === "pago")
    .reduce((a, l) => a + l.valor, 0)
  const saldo = entradas - saidas
  const pendente = rows
    .filter((l) => l.status !== "pago")
    .reduce((a, l) => a + l.valor, 0)

  return (
    <>
      <div className="list-kpis">
        <div className="list-kpi tone-success">
          <div className="list-kpi-label">Entradas (pagas)</div>
          <div className="list-kpi-value fin-pos">{fmtBRLk(entradas)}</div>
          <div className="list-kpi-sub">
            <Icon name="arrowDown" />
            Recebimentos confirmados
          </div>
        </div>
        <div className="list-kpi tone-danger">
          <div className="list-kpi-label">Saídas (pagas)</div>
          <div className="list-kpi-value fin-neg">{fmtBRLk(saidas)}</div>
          <div className="list-kpi-sub">
            <Icon name="arrowUp" />
            Pagamentos efetuados
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Saldo</div>
          <div
            className={
              "list-kpi-value " + (saldo >= 0 ? "fin-pos" : "fin-neg")
            }
          >
            {fmtBRLk(saldo)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            Consolidado
          </div>
        </div>
        <div className="list-kpi tone-warning">
          <div className="list-kpi-label">Em aberto</div>
          <div className="list-kpi-value">{fmtBRLk(pendente)}</div>
          <div className="list-kpi-sub">
            <Icon name="clock" />A pagar / receber
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head">
          <h3>
            <Icon name="dollar" />
            Lançamentos da obra
          </h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setFormOpen(true)}
          >
            <Icon name="plus" />
            Novo lançamento
          </button>
        </div>
        <div className="list-table">
          <div className="list-thead">
            <div>Descrição</div>
            <div>Categoria</div>
            <div>Data</div>
            <div>Contraparte</div>
            <div className="num">Valor</div>
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
          ) : rows.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--ink-muted)",
                fontSize: 13.5,
              }}
            >
              Nenhum lançamento nesta obra.
            </div>
          ) : (
            rows.map((l) => (
              <div className="list-row2" key={l.id}>
                <div className="list-cell-name">
                  <span className={"lanc-icon " + l.tipo}>
                    <Icon name={l.tipo === "in" ? "arrowDown" : "arrowUp"} />
                  </span>
                  <div className="list-name-block">
                    <div className="nm">{l.desc}</div>
                    <div className="sub mono">{l.id}</div>
                  </div>
                </div>
                <div>
                  <span
                    className="tipo-tag"
                    style={{
                      background: "var(--surface-muted)",
                      color: "var(--ink-muted)",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {l.cat || "—"}
                  </span>
                </div>
                <div>
                  <div className="em mono">{l.data}</div>
                </div>
                <div className="list-cell-contact">
                  <div className="em">{l.fornecedor || "—"}</div>
                </div>
                <div className="list-cell-num">
                  <div
                    className={
                      "val mono " + (l.tipo === "in" ? "fin-pos" : "fin-neg")
                    }
                  >
                    {l.tipo === "in" ? "+ " : "− "}
                    {fmtBRL(l.valor)}
                  </div>
                </div>
                <div className="list-cell-status">
                  <StatusBadge s={l.status} />
                </div>
                <div className="list-cell-actions">
                  <button type="button" className="icon-btn">
                    <Icon name="more" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <LancamentoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </>
  )
}
