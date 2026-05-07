"use client"

// Port literal de granum-design/lancamentos-app.jsx + Lancamentos.html

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

import { LancamentoForm } from "@/components/forms/lancamento-form"
import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface LancRow {
  id: string
  rawId: number
  data: string
  dataIso: string
  tipo: "in" | "out"
  desc: string
  cat: string
  catColor: "info" | "success" | "warning" | "neutral"
  obra: string
  obraId: string
  parte: string
  valor: number
  forma: string
  status: "pago" | "pendente" | "atrasado"
  venc: string
}

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  info: { bg: "var(--info-soft)", fg: "var(--info-ink)" },
  success: { bg: "var(--success-soft)", fg: "var(--success-ink)" },
  warning: { bg: "var(--warning-soft)", fg: "var(--warning-ink)" },
  neutral: { bg: "var(--surface-muted)", fg: "var(--ink-muted)" },
}

const FORMA_META: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  ted: "TED",
  doc: "DOC",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
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

function CatPill({
  label,
  color,
}: {
  label: string
  color: keyof typeof CAT_COLORS
}) {
  const c = CAT_COLORS[color] ?? CAT_COLORS.neutral
  return (
    <span
      className="tipo-tag"
      style={{ background: c.bg, color: c.fg, fontWeight: 500, fontSize: 11 }}
    >
      {label}
    </span>
  )
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

function categoriaToneFromCC(centroCusto: string): LancRow["catColor"] {
  const lower = centroCusto.toLowerCase()
  if (
    lower.includes("material") ||
    lower.includes("estrutura") ||
    lower.includes("acabamento")
  )
    return "info"
  if (lower.includes("medi") || lower.includes("faturamento"))
    return "success"
  if (
    lower.includes("mão") ||
    lower.includes("mao") ||
    lower.includes("loca") ||
    lower.includes("servi") ||
    lower.includes("emprei") ||
    lower.includes("diaria")
  )
    return "warning"
  return "neutral"
}

export default function LancamentosPage() {
  const [rows, setRows] = useState<LancRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fTipo, setFTipo] = useState<"todos" | "in" | "out">("todos")
  const [fStatus, setFStatus] = useState<
    "todos" | "pago" | "pendente" | "atrasado"
  >("todos")
  const [fObra, setFObra] = useState<"todas" | string>("todas")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: lancs, error } = await supabase
      .from("lancamento")
      .select("*")
      .order("data_competencia", { ascending: false })

    if (error) {
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }

    const list = lancs ?? []
    const obraIds = Array.from(new Set(list.map((l) => l.id_obra)))
    const fornIds = Array.from(
      new Set(
        list.filter((l) => l.id_fornecedor).map((l) => l.id_fornecedor!)
      )
    )
    const ccIds = Array.from(new Set(list.map((l) => l.id_centro_custo)))

    const [obrasRes, fornsRes, ccsRes] = await Promise.all([
      obraIds.length
        ? supabase
            .from("obra")
            .select("id_obra, nome")
            .in("id_obra", obraIds)
        : Promise.resolve({ data: [] as { id_obra: number; nome: string }[] }),
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

    const obraMap = new Map(
      (obrasRes.data ?? []).map((o) => [o.id_obra, o.nome as string])
    )
    const fornMap = new Map(
      (fornsRes.data ?? []).map((f) => [f.id_fornecedor, f.nome as string])
    )
    const ccMap = new Map(
      (ccsRes.data ?? []).map((c) => [c.id_centro_custo, c.nome as string])
    )

    const today = format(new Date(), "yyyy-MM-dd")

    setRows(
      list.map((l) => {
        const status: LancRow["status"] = l.data_pagamento
          ? "pago"
          : l.data_competencia < today
            ? "atrasado"
            : "pendente"
        const cc = ccMap.get(l.id_centro_custo) ?? ""
        return {
          id: `LN-${String(l.id_lancamento).padStart(4, "0")}`,
          rawId: l.id_lancamento,
          data: format(new Date(l.data_competencia), "dd/MM/yyyy"),
          dataIso: l.data_competencia,
          tipo: l.entrada_saida === "entrada" ? "in" : "out",
          desc: l.historico ?? "(sem descrição)",
          cat: cc,
          catColor: categoriaToneFromCC(cc),
          obra: obraMap.get(l.id_obra) ?? "—",
          obraId: `OBR-${String(l.id_obra).padStart(4, "0")}`,
          parte: l.id_fornecedor
            ? fornMap.get(l.id_fornecedor) ?? ""
            : "",
          valor: Number(l.valor),
          forma: l.forma_pagamento ?? "",
          status,
          venc: format(new Date(l.data_competencia), "dd/MM/yyyy"),
        }
      })
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () =>
      Array.from(new Set(rows.map((l) => l.obra).filter((n) => n && n !== "—"))).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((l) => {
        if (fTipo !== "todos" && l.tipo !== fTipo) return false
        if (fStatus !== "todos" && l.status !== fStatus) return false
        if (fObra !== "todas" && l.obra !== fObra) return false
        if (
          busca &&
          !(l.desc + l.parte + l.id)
            .toLowerCase()
            .includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [rows, fTipo, fStatus, fObra, busca]
  )

  const entradas = rows
    .filter((l) => l.tipo === "in" && l.status === "pago")
    .reduce((a, l) => a + l.valor, 0)
  const saidas = rows
    .filter((l) => l.tipo === "out" && l.status === "pago")
    .reduce((a, l) => a + l.valor, 0)
  const saldo = entradas - saidas
  const pendTotal = rows
    .filter((l) => l.status !== "pago")
    .reduce((a, l) => a + l.valor, 0)
  const atrasadoTotal = rows
    .filter((l) => l.status === "atrasado")
    .reduce((a, l) => a + l.valor, 0)

  const byDate = useMemo(() => {
    const map = new Map<string, LancRow[]>()
    for (const l of filtered) {
      const arr = map.get(l.data) ?? []
      arr.push(l)
      map.set(l.data, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Financeiro · {monthLabel}</div>
            <h1>Lançamentos</h1>
            <div className="subtitle">
              {rows.length} lançamentos no período · {filtered.length} visíveis
              com os filtros atuais
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="download" />
              Exportar CSV
            </button>
            <button className="btn btn-secondary" type="button" disabled>
              <Icon name="upload" />
              Importar extrato
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setFormOpen(true)}
            >
              <Icon name="plus" />
              Novo lançamento
            </button>
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi">
          <div className="list-kpi-label">Entradas (pagas)</div>
          <div className="list-kpi-value fin-pos">{fmtBRLk(entradas)}</div>
          <div className="list-kpi-sub">
            <Icon name="arrowDown" style={{ color: "var(--success)" }} />
            {rows.filter((l) => l.tipo === "in" && l.status === "pago").length}{" "}
            recebimentos confirmados
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Saídas (pagas)</div>
          <div className="list-kpi-value fin-neg">{fmtBRLk(saidas)}</div>
          <div className="list-kpi-sub">
            <Icon name="arrowUp" style={{ color: "var(--danger)" }} />
            {rows.filter((l) => l.tipo === "out" && l.status === "pago").length}{" "}
            pagamentos efetuados
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Saldo do período</div>
          <div
            className={"list-kpi-value " + (saldo >= 0 ? "fin-pos" : "fin-neg")}
          >
            {fmtBRLk(saldo)}
          </div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            {saldo >= 0
              ? "Positivo no consolidado"
              : "Negativo no consolidado"}
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">A receber / pagar</div>
          <div className="list-kpi-value">{fmtBRLk(pendTotal)}</div>
          <div className="list-kpi-sub">
            <Icon name="clock" />
            Dos quais{" "}
            <span className="fin-neg" style={{ marginLeft: 3 }}>
              {fmtBRLk(atrasadoTotal)} atrasados
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por descrição, fornecedor, ID…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
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
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "in", label: "Entradas" },
                  { id: "out", label: "Saídas" },
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
                  { id: "pago", label: "Pagos" },
                  { id: "pendente", label: "Pendentes" },
                  { id: "atrasado", label: "Atrasados" },
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

        <div className="list-table list-table-lanc">
          <div className="list-thead">
            <div>Descrição</div>
            <div>Categoria</div>
            <div>Obra · Contraparte</div>
            <div>Forma · Venc.</div>
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
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--ink-muted)",
                fontSize: 13.5,
              }}
            >
              Nenhum lançamento encontrado com esses filtros.
            </div>
          ) : (
            byDate.map(([data, items]) => (
              <Fragment key={data}>
                <div className="lanc-date-sep">
                  <span>{data}</span>
                  <span className="sub">
                    {items.length} lançamento{items.length > 1 ? "s" : ""}
                  </span>
                </div>
                {items.map((l) => (
                  <div className="list-row2" key={l.id}>
                    <div className="list-cell-name">
                      <span className={"lanc-icon " + l.tipo}>
                        <Icon name={l.tipo === "in" ? "arrowDown" : "arrowUp"} />
                      </span>
                      <div className="list-name-block">
                        <div className="nm">
                          <a>{l.desc}</a>
                        </div>
                        <div className="sub mono">{l.id}</div>
                      </div>
                    </div>
                    <div>
                      {l.cat ? (
                        <CatPill label={l.cat} color={l.catColor} />
                      ) : (
                        <span className="sub">—</span>
                      )}
                    </div>
                    <div className="list-cell-contact">
                      <div className="em" style={{ fontSize: 13 }}>
                        {l.obra}
                      </div>
                      {l.parte ? <div className="sub">{l.parte}</div> : null}
                    </div>
                    <div>
                      {l.forma ? (
                        <div
                          style={{
                            fontSize: 13,
                            color: "var(--ink)",
                            fontWeight: 500,
                          }}
                        >
                          {FORMA_META[l.forma] ?? l.forma}
                        </div>
                      ) : null}
                      <div className="sub">venc. {l.venc}</div>
                    </div>
                    <div className="list-cell-num">
                      <div
                        className={
                          "val mono " +
                          (l.tipo === "in" ? "fin-pos" : "fin-neg")
                        }
                        style={{ fontSize: 14 }}
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
                ))}
              </Fragment>
            ))
          )}
        </div>

        <div className="list-foot">
          <div className="sub">
            Mostrando {filtered.length} de {rows.length} lançamentos
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

      <LancamentoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </>
  )
}
