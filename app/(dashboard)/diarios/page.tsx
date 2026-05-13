"use client"

// /diarios — DiarioHistorico.html como rota global (histórico de todas as obras)

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format, parseISO, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/granum/icon"
import { DIARIO_ORIGEM, DIARIO_REVISAO } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { truncate } from "@/lib/utils/format"

interface Diario {
  id_diario: number
  id_obra: number
  obra_nome: string
  data: string
  conteudo: string | null
  origem: string
  status_revisao: string
  clima_condicao: string | null
  clima_temperatura: number | null
  clima_chuva: boolean | null
  id_responsavel: number | null
}

const CLIMA_ICON: Record<string, string> = {
  sol: "sun",
  parcial: "cloud",
  chuva: "cloudRain",
  encoberto: "cloud",
}
const CLIMA_LABEL: Record<string, string> = {
  sol: "Sol",
  parcial: "Parcial",
  chuva: "Chuva",
  encoberto: "Encoberto",
}

const REVISAO_META: Record<string, { cls: string; label: string }> = {
  aprovado: { cls: "badge-success", label: "Aprovado" },
  pendente: { cls: "badge-warning", label: "Pendente" },
  rejeitado: { cls: "badge-danger", label: "Rejeitado" },
}

export default function DiariosHistoricoPage() {
  const [diarios, setDiarios] = useState<Diario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroObra, setFiltroObra] = useState<"todas" | string>("todas")
  const [filtroOrigem, setFiltroOrigem] = useState<"todos" | string>("todos")
  const [filtroClima, setFiltroClima] = useState<
    "todos" | "sol" | "parcial" | "chuva"
  >("todos")
  const [busca, setBusca] = useState("")

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("diario_obra")
      .select("*")
      .order("data", { ascending: false })
      .limit(120)

    const list = (data ?? []) as (Diario & { id_obra: number })[]
    const obraIds = Array.from(new Set(list.map((d) => d.id_obra)))
    const { data: obras } = obraIds.length
      ? await supabase
          .from("obra")
          .select("id_obra, nome")
          .in("id_obra", obraIds)
      : { data: [] as { id_obra: number; nome: string }[] }
    const obraMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.nome as string])
    )
    setDiarios(
      list.map((d) => ({ ...d, obra_nome: obraMap.get(d.id_obra) ?? "" }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () =>
      Array.from(new Set(diarios.map((d) => d.obra_nome).filter(Boolean))).sort(),
    [diarios]
  )

  const filtered = useMemo(
    () =>
      diarios.filter((d) => {
        if (filtroObra !== "todas" && d.obra_nome !== filtroObra) return false
        if (filtroOrigem !== "todos" && d.origem !== filtroOrigem) return false
        if (filtroClima !== "todos") {
          if (filtroClima === "chuva" && !d.clima_chuva) return false
          if (
            filtroClima !== "chuva" &&
            d.clima_condicao !== filtroClima
          )
            return false
        }
        if (
          busca &&
          !(d.conteudo ?? "").toLowerCase().includes(busca.toLowerCase()) &&
          !d.obra_nome.toLowerCase().includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [diarios, filtroObra, filtroOrigem, filtroClima, busca]
  )

  // Agrupar por semana
  const weeks = useMemo(() => {
    const map = new Map<string, { label: string; items: Diario[] }>()
    for (const d of filtered) {
      const date = parseISO(d.data)
      const ws = startOfWeek(date, { weekStartsOn: 1 })
      const key = format(ws, "yyyy-MM-dd")
      if (!map.has(key)) {
        map.set(key, {
          label: `Semana de ${format(ws, "dd 'de' MMM", { locale: ptBR })}`,
          items: [],
        })
      }
      map.get(key)!.items.push(d)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, v]) => ({ key, ...v }))
  }, [filtered])

  const aprovados = diarios.filter((d) => d.status_revisao === "aprovado").length
  const pendentes = diarios.filter(
    (d) => d.status_revisao === "pendente"
  ).length
  const comChuva = diarios.filter((d) => d.clima_chuva).length

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Operacional · Diários</div>
            <h1>Histórico de diários</h1>
            <div className="subtitle">
              {diarios.length} diário{diarios.length === 1 ? "" : "s"} de obra
              ·{" "}
              {obras.length} obra{obras.length === 1 ? "" : "s"} ativa
              {obras.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="download" />
              Exportar PDF
            </button>
          </div>
        </div>

        <div
          className="list-kpis"
          style={{
            marginTop: 18,
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          }}
        >
          <div className="list-kpi tone-info">
            <div className="list-kpi-head">
              <span className="list-kpi-label">Diários lançados</span>
              <span className="kpi-icon">
                <Icon name="book" />
              </span>
            </div>
            <div className="list-kpi-value">{diarios.length}</div>
            <div className="list-kpi-sub">No histórico recente</div>
          </div>
          <div className="list-kpi tone-success">
            <div className="list-kpi-head">
              <span className="list-kpi-label">Aprovados</span>
              <span className="kpi-icon">
                <Icon name="check" />
              </span>
            </div>
            <div className="list-kpi-value">{aprovados}</div>
            <div className="list-kpi-sub">Revisão concluída</div>
          </div>
          <div className="list-kpi tone-warning">
            <div className="list-kpi-head">
              <span className="list-kpi-label">Pendentes de revisão</span>
              <span className="kpi-icon">
                <Icon name="clock" />
              </span>
            </div>
            <div className="list-kpi-value">{pendentes}</div>
            <div className="list-kpi-sub">Aguardando aprovação</div>
          </div>
          <div className="list-kpi">
            <div className="list-kpi-head">
              <span className="list-kpi-label">Dias com chuva</span>
              <span className="kpi-icon">
                <Icon name="cloudRain" />
              </span>
            </div>
            <div className="list-kpi-value">{comChuva}</div>
            <div className="list-kpi-sub">Registrados no clima</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar no conteúdo ou obra…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <select
              className="seg-select"
              value={filtroObra}
              onChange={(e) => setFiltroObra(e.target.value)}
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
                  { id: "todos", label: "Todo clima" },
                  { id: "sol", label: "Sol" },
                  { id: "parcial", label: "Parcial" },
                  { id: "chuva", label: "Chuva" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={
                    "seg-btn" + (filtroClima === t.id ? " active" : "")
                  }
                  onClick={() => setFiltroClima(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todas origens" },
                  { id: "manual", label: "Manual" },
                  { id: "whatsapp", label: "WhatsApp" },
                  { id: "plaud", label: "Plaud" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={
                    "seg-btn" + (filtroOrigem === t.id ? " active" : "")
                  }
                  onClick={() => setFiltroOrigem(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-body" style={{ padding: "8px 0 18px" }}>
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
              {diarios.length === 0
                ? "Nenhum diário registrado ainda."
                : "Nenhum diário com esses filtros."}
            </div>
          ) : (
            <div className="diary-tl">
              {weeks.map((w) => (
                <div className="diary-tl-week" key={w.key}>
                  <div className="diary-tl-week-head">
                    <span className="diary-tl-week-label">{w.label}</span>
                    <span className="diary-tl-week-line" />
                    <span className="diary-tl-week-count">
                      {w.items.length} diário{w.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {w.items.map((d) => {
                    const date = parseISO(d.data)
                    const day = format(date, "dd")
                    const dow = format(date, "EEE", { locale: ptBR })
                      .toUpperCase()
                      .replace(".", "")
                    const climaKey = (d.clima_condicao ?? "sol") as string
                    const climaIcon = CLIMA_ICON[climaKey] ?? "sun"
                    const climaLabel = CLIMA_LABEL[climaKey] ?? climaKey
                    const origemMeta = (DIARIO_ORIGEM as Record<
                      string,
                      { label: string }
                    >)[d.origem]
                    const revisaoMeta =
                      REVISAO_META[d.status_revisao] ?? REVISAO_META.pendente
                    return (
                      <div className="diary-tl-item" key={d.id_diario}>
                        <div className="diary-tl-rail">
                          <div className="diary-tl-date">
                            <div className="diary-tl-day">{day}</div>
                            <div className="diary-tl-dow">{dow}</div>
                          </div>
                          <div className="diary-tl-dot">
                            <Icon name={climaIcon} />
                          </div>
                        </div>
                        <Link
                          href={`/obras/${d.id_obra}/diarios`}
                          className="diary-tl-card"
                        >
                          <div className="diary-tl-card-head">
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span className="diary-clima">
                                <Icon name={climaIcon} />
                                {climaLabel}
                                {d.clima_temperatura != null ? (
                                  <> · {Math.round(d.clima_temperatura)}°C</>
                                ) : null}
                              </span>
                              <span className={"badge dot " + revisaoMeta.cls}>
                                {revisaoMeta.label}
                              </span>
                              {d.origem === "plaud" ? (
                                <span className="badge badge-info">
                                  <Icon name="mic" />
                                  Plaud
                                </span>
                              ) : d.origem === "whatsapp" ? (
                                <span className="badge badge-info">
                                  <Icon name="messageSquare" />
                                  WhatsApp
                                </span>
                              ) : (
                                <span className="badge badge-neutral">
                                  <Icon name="edit" />
                                  {origemMeta?.label ?? "Manual"}
                                </span>
                              )}
                              <span
                                style={{
                                  color: "var(--ink-muted)",
                                  fontSize: 12.5,
                                }}
                              >
                                {d.obra_nome}
                              </span>
                            </div>
                          </div>
                          <div className="diary-tl-card-body">
                            <p
                              style={{
                                fontSize: 13,
                                color: "var(--ink)",
                                lineHeight: 1.5,
                                margin: 0,
                              }}
                            >
                              {d.conteudo
                                ? truncate(d.conteudo, 280)
                                : "Sem conteúdo"}
                            </p>
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
