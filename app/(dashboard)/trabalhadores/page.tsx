"use client"

// Port literal de granum-design/trabalhadores-app.jsx + Trabalhadores.html

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { endOfWeek, format, startOfWeek } from "date-fns"
import { toast } from "sonner"

import { TrabalhadorForm } from "@/components/forms/trabalhador-form"
import { Icon } from "@/components/granum/icon"
import { ESPECIALIDADE } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatCPF } from "@/lib/utils/format"

interface TrabRow {
  id: string
  rawId: number
  nome: string
  init: string
  esp: string
  vinculo: string
  valor: number
  doc: string
  fone: string
  pix: string
  obras: number
  presencaSem: number
  presencaPct: number
  ultima: string
  status: "ativo" | "inativo"
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

function fmtPct(v: number): string {
  return v.toFixed(0) + "%"
}

const VINC_META: Record<string, { label: string; bg: string; fg: string }> = {
  diaria: {
    label: "Diária",
    bg: "color-mix(in oklab, var(--info) 18%, var(--surface-muted))",
    fg: "var(--info-ink)",
  },
  empreitada: {
    label: "Empreitada",
    bg: "color-mix(in oklab, var(--warning) 22%, var(--surface-muted))",
    fg: "var(--warning-ink)",
  },
  mensal: {
    label: "Mensal",
    bg: "color-mix(in oklab, var(--success) 20%, var(--surface-muted))",
    fg: "var(--success-ink)",
  },
  autonomo: {
    label: "Autônomo",
    bg: "color-mix(in oklab, var(--info) 18%, var(--surface-muted))",
    fg: "var(--info-ink)",
  },
  clt: {
    label: "CLT",
    bg: "color-mix(in oklab, var(--success) 20%, var(--surface-muted))",
    fg: "var(--success-ink)",
  },
  pj: {
    label: "PJ",
    bg: "color-mix(in oklab, var(--primary) 18%, var(--surface-muted))",
    fg: "var(--primary)",
  },
  empreiteiro: {
    label: "Empreiteiro",
    bg: "color-mix(in oklab, var(--warning) 22%, var(--surface-muted))",
    fg: "var(--warning-ink)",
  },
}

function VincBadge({ v }: { v: string }) {
  const m = VINC_META[v] ?? {
    label: v[0]?.toUpperCase() + v.slice(1),
    bg: "var(--surface-muted)",
    fg: "var(--ink-muted)",
  }
  return (
    <span
      className="tipo-tag"
      style={{ background: m.bg, color: m.fg, fontWeight: 500, fontSize: 11 }}
    >
      {m.label}
    </span>
  )
}

function StatusBadge({ s }: { s: TrabRow["status"] }) {
  return s === "ativo" ? (
    <span className="badge dot badge-success">Ativo</span>
  ) : (
    <span className="badge dot badge-neutral">Inativo</span>
  )
}

function PresencaBar({ sem, max = 6 }: { sem: number; max?: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        alignItems: "flex-end",
        height: 14,
      }}
    >
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 14,
            borderRadius: 2,
            background: i < sem ? "var(--success)" : "var(--line-strong)",
          }}
        />
      ))}
    </div>
  )
}

function vinculoUnit(v: string): string {
  if (v === "diaria" || v === "autonomo") return "/dia"
  if (v === "mensal" || v === "clt") return "/mês"
  return ""
}

export default function TrabalhadoresPage() {
  const router = useRouter()
  const [rows, setRows] = useState<TrabRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fEsp, setFEsp] = useState<"todas" | string>("todas")
  const [fVinc, setFVinc] = useState<"todos" | string>("todos")
  const [fStatus, setFStatus] = useState<"todos" | "ativo" | "inativo">(
    "todos"
  )
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: trabs, error } = await supabase
      .from("trabalhador")
      .select("*")
      .order("nome")

    if (error) {
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }

    // Presença da semana via diario_obra + presenca
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    const { data: diarios } = await supabase
      .from("diario_obra")
      .select("id_diario, data")
      .gte("data", format(weekStart, "yyyy-MM-dd"))
      .lte("data", format(weekEnd, "yyyy-MM-dd"))

    const presencasPorTrab = new Map<number, Set<string>>()
    if (diarios && diarios.length > 0) {
      const diarioMap = new Map(
        diarios.map((d) => [d.id_diario, d.data as string])
      )
      const { data: presencas } = await supabase
        .from("presenca")
        .select("id_trabalhador, id_diario")
        .in("id_diario", Array.from(diarioMap.keys()))
      for (const p of presencas ?? []) {
        const data = diarioMap.get(p.id_diario)
        if (!data) continue
        const set =
          presencasPorTrab.get(p.id_trabalhador) ?? new Set<string>()
        set.add(data)
        presencasPorTrab.set(p.id_trabalhador, set)
      }
    }

    setRows(
      (trabs ?? []).map((t) => {
        const presencaSem =
          presencasPorTrab.get(t.id_trabalhador)?.size ?? 0
        return {
          id: `TRB-${String(t.id_trabalhador).padStart(4, "0")}`,
          rawId: t.id_trabalhador,
          nome: t.nome,
          init: getInitials(t.nome),
          esp: t.especialidade ?? "",
          vinculo: t.tipo_vinculo ?? "",
          valor: 0, // não tem no schema do trabalhador, ficaria do contrato ativo
          doc: t.cpf ? formatCPF(t.cpf) : "—",
          fone: t.telefone ?? "",
          pix: t.pix_chave ?? "",
          obras: 0,
          presencaSem,
          presencaPct: Math.round((presencaSem / 6) * 100),
          ultima: "—",
          status: t.ativo === false ? "inativo" : "ativo",
        }
      })
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const especialidades = useMemo(
    () =>
      Array.from(new Set(rows.map((t) => t.esp).filter(Boolean))).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((t) => {
        if (fEsp !== "todas" && t.esp !== fEsp) return false
        if (fVinc !== "todos" && t.vinculo !== fVinc) return false
        if (fStatus !== "todos" && t.status !== fStatus) return false
        if (
          busca &&
          !(t.nome + t.doc).toLowerCase().includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [rows, fEsp, fVinc, fStatus, busca]
  )

  const ativos = rows.filter((t) => t.status === "ativo").length
  const trabSemana = rows.filter((t) => t.presencaSem > 0).length
  const custoSemana = rows
    .filter((t) => t.status === "ativo")
    .reduce(
      (a, t) =>
        a + (t.vinculo === "diaria" ? t.valor * t.presencaSem : 0),
      0
    )
  const mediaPres =
    ativos > 0
      ? Math.round(
          rows
            .filter((t) => t.status === "ativo")
            .reduce((a, t) => a + t.presencaPct, 0) / ativos
        )
      : 0

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Cadastros</div>
            <h1>Trabalhadores</h1>
            <div className="subtitle">
              {rows.length} trabalhadores cadastrados · {ativos} ativos ·{" "}
              {trabSemana} com presença esta semana
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
              Novo trabalhador
            </button>
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi">
          <div className="list-kpi-label">Total ativos</div>
          <div className="list-kpi-value">{ativos}</div>
          <div className="list-kpi-sub">
            <Icon name="hammer" />
            {rows.length} cadastrados
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Trabalhando esta semana</div>
          <div className="list-kpi-value">{trabSemana}</div>
          <div className="list-kpi-sub">
            <Icon name="users" />
            {ativos > 0 ? Math.round((trabSemana * 100) / ativos) : 0}% dos
            ativos
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Custo semanal estimado</div>
          <div className="list-kpi-value fin-neg">{fmtBRL(custoSemana)}</div>
          <div className="list-kpi-sub">
            <Icon name="dollar" />
            Apenas diaristas
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Taxa de presença</div>
          <div className="list-kpi-value">{fmtPct(mediaPres)}</div>
          <div className="list-kpi-sub">
            <Icon name="check" />
            Sob 6 dias úteis
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <select
              className="seg-select"
              value={fEsp}
              onChange={(e) => setFEsp(e.target.value)}
            >
              <option value="todas">Todas especialidades</option>
              {especialidades.map((e) => (
                <option key={e} value={e}>
                  {(ESPECIALIDADE as Record<string, string>)[e] ?? e}
                </option>
              ))}
            </select>
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todos vínculos" },
                  { id: "autonomo", label: "Autônomo" },
                  { id: "clt", label: "CLT" },
                  { id: "pj", label: "PJ" },
                  { id: "empreiteiro", label: "Empreit." },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"seg-btn" + (fVinc === t.id ? " active" : "")}
                  onClick={() => setFVinc(t.id)}
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

        <div className="list-table list-table-trab">
          <div className="list-thead">
            <div>Trabalhador</div>
            <div>CPF · Pix</div>
            <div>Especialidade</div>
            <div>Vínculo · Valor</div>
            <div>Presença semana</div>
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
              Nenhum trabalhador encontrado.
            </div>
          ) : (
            filtered.map((t) => (
              <div
                className="list-row2"
                key={t.id}
                onClick={() => router.push(`/trabalhadores/${t.rawId}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="list-cell-name">
                  <span className="avatar-sm">{t.init}</span>
                  <div className="list-name-block">
                    <div className="nm">
                      <a>{t.nome}</a>
                    </div>
                    <div className="sub">
                      {t.id}
                      {t.fone ? ` · ${t.fone}` : ""}
                    </div>
                  </div>
                </div>
                <div className="list-cell-doc">
                  <div className="mono">{t.doc}</div>
                  {t.pix ? (
                    <div
                      className="sub mono"
                      style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      pix: {t.pix}
                    </div>
                  ) : null}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink)",
                      fontWeight: 500,
                    }}
                  >
                    {(ESPECIALIDADE as Record<string, string>)[t.esp] ??
                      t.esp ??
                      "—"}
                  </div>
                  {t.obras > 0 ? (
                    <div className="sub">
                      {t.obras} obra{t.obras !== 1 ? "s" : ""}
                      {" ativa"}
                      {t.obras !== 1 ? "s" : ""}
                    </div>
                  ) : null}
                </div>
                <div>
                  {t.vinculo ? <VincBadge v={t.vinculo} /> : null}
                  {t.valor > 0 ? (
                    <div
                      className="mono"
                      style={{
                        fontSize: 13,
                        color: "var(--ink)",
                        marginTop: 4,
                      }}
                    >
                      {fmtBRL(t.valor)}
                      {vinculoUnit(t.vinculo)}
                    </div>
                  ) : null}
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <PresencaBar sem={t.presencaSem} />
                    <span
                      className="mono"
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      {t.presencaSem}/6
                    </span>
                  </div>
                  <div className="sub">últ. {t.ultima}</div>
                </div>
                <div className="list-cell-status">
                  <StatusBadge s={t.status} />
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
            Mostrando {filtered.length} de {rows.length} trabalhadores
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

      <TrabalhadorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </>
  )
}

