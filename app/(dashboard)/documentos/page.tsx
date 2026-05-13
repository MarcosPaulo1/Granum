"use client"

// /documentos — listagem global de todos os documentos de todas as obras

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Icon } from "@/components/granum/icon"
import { DOCUMENTO_TIPO } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatDateTime } from "@/lib/utils/format"

interface DocRow {
  id_documento: number
  nome: string
  tipo: string
  url_sharepoint: string | null
  data_criacao: string
  id_obra: number
  obra_nome: string
}

const TIPO_COLORS: Record<string, { bg: string; fg: string }> = {
  projeto: { bg: "var(--info-soft)", fg: "var(--info-ink)" },
  foto: {
    bg: "color-mix(in oklab, var(--primary) 14%, var(--surface-muted))",
    fg: "var(--primary)",
  },
  transcricao: { bg: "var(--warning-soft)", fg: "var(--warning-ink)" },
  contrato: { bg: "var(--success-soft)", fg: "var(--success-ink)" },
}

const TIPO_ICON: Record<string, string> = {
  projeto: "layout",
  foto: "image",
  transcricao: "mic",
  contrato: "fileText",
  outro: "folder",
}

export default function DocumentosGlobalPage() {
  const [docs, setDocs] = useState<DocRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroObra, setFiltroObra] = useState<"todas" | string>("todas")
  const [filtroTipo, setFiltroTipo] = useState<"todos" | string>("todos")
  const [busca, setBusca] = useState("")

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("documento")
      .select("*")
      .order("data_criacao", { ascending: false })
      .limit(200)

    const list = (data ?? []) as DocRow[]
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
    setDocs(
      list.map((d) => ({ ...d, obra_nome: obraMap.get(d.id_obra) ?? "—" }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () =>
      Array.from(new Set(docs.map((d) => d.obra_nome).filter(Boolean))).sort(),
    [docs]
  )
  const tipos = useMemo(
    () => Array.from(new Set(docs.map((d) => d.tipo))).sort(),
    [docs]
  )

  const filtered = useMemo(
    () =>
      docs.filter((d) => {
        if (filtroObra !== "todas" && d.obra_nome !== filtroObra) return false
        if (filtroTipo !== "todos" && d.tipo !== filtroTipo) return false
        if (busca) {
          const q = busca.toLowerCase()
          if (
            !d.nome.toLowerCase().includes(q) &&
            !d.obra_nome.toLowerCase().includes(q)
          )
            return false
        }
        return true
      }),
    [docs, filtroObra, filtroTipo, busca]
  )

  const total = docs.length
  const comUrl = docs.filter((d) => d.url_sharepoint).length
  const porTipo = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of docs) map.set(d.tipo, (map.get(d.tipo) ?? 0) + 1)
    return map
  }, [docs])

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Operacional · Documentos</div>
            <h1>Documentos de todas as obras</h1>
            <div className="subtitle">
              {total} documento{total === 1 ? "" : "s"} ·{" "}
              {obras.length} obra{obras.length === 1 ? "" : "s"} ·{" "}
              {comUrl} com link no SharePoint
            </div>
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
              <span className="list-kpi-label">Total de documentos</span>
              <span className="kpi-icon">
                <Icon name="folder" />
              </span>
            </div>
            <div className="list-kpi-value">{total}</div>
            <div className="list-kpi-sub">
              <Icon name="building" />
              Em {obras.length} obra{obras.length === 1 ? "" : "s"}
            </div>
          </div>
          {Array.from(porTipo.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tipo, qty]) => {
              const meta = DOCUMENTO_TIPO[
                tipo as keyof typeof DOCUMENTO_TIPO
              ] as { label: string } | undefined
              return (
                <div key={tipo} className="list-kpi">
                  <div className="list-kpi-head">
                    <span className="list-kpi-label">
                      {meta?.label ?? tipo}
                    </span>
                    <span className="kpi-icon">
                      <Icon name={TIPO_ICON[tipo] ?? "folder"} />
                    </span>
                  </div>
                  <div className="list-kpi-value">{qty}</div>
                  <div className="list-kpi-sub">
                    <Icon name="fileText" />
                    {total > 0 ? Math.round((qty * 100) / total) : 0}% do total
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por nome ou obra…"
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
            <select
              className="seg-select"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="todos">Todos os tipos</option>
              {tipos.map((t) => {
                const meta = DOCUMENTO_TIPO[
                  t as keyof typeof DOCUMENTO_TIPO
                ] as { label: string } | undefined
                return (
                  <option key={t} value={t}>
                    {meta?.label ?? t}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div className="list-table">
          <div className="list-thead">
            <div>Documento</div>
            <div>Obra</div>
            <div>Tipo</div>
            <div>Data</div>
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
              {docs.length === 0
                ? "Nenhum documento cadastrado em nenhuma obra."
                : "Nenhum documento com esses filtros."}
            </div>
          ) : (
            filtered.map((d) => {
              const meta = DOCUMENTO_TIPO[
                d.tipo as keyof typeof DOCUMENTO_TIPO
              ] as { label: string } | undefined
              const tipoColor = TIPO_COLORS[d.tipo] ?? {
                bg: "var(--surface-muted)",
                fg: "var(--ink-muted)",
              }
              const iconName = TIPO_ICON[d.tipo] ?? "fileText"
              return (
                <div
                  className="list-row2"
                  key={d.id_documento}
                  style={{
                    gridTemplateColumns:
                      "minmax(280px, 2.4fr) minmax(180px, 1.4fr) 140px 160px 60px",
                  }}
                >
                  <div className="list-cell-name">
                    <span
                      className="lanc-icon"
                      style={{
                        background: tipoColor.bg,
                        color: tipoColor.fg,
                      }}
                    >
                      <Icon name={iconName} />
                    </span>
                    <div className="list-name-block">
                      <div className="nm">{d.nome}</div>
                      {d.url_sharepoint ? (
                        <div
                          className="sub mono"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 380,
                          }}
                        >
                          {d.url_sharepoint}
                        </div>
                      ) : (
                        <div className="sub">Sem link externo</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Link
                      href={`/obras/${d.id_obra}/documentos`}
                      style={{
                        fontSize: 13,
                        color: "var(--primary)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon
                        name="building"
                        style={{ width: 12, height: 12 }}
                      />
                      {d.obra_nome}
                    </Link>
                  </div>
                  <div>
                    <span
                      className="tipo-tag"
                      style={{
                        background: tipoColor.bg,
                        color: tipoColor.fg,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {meta?.label ?? d.tipo}
                    </span>
                  </div>
                  <div className="em mono">
                    {d.data_criacao ? formatDateTime(d.data_criacao) : "—"}
                  </div>
                  <div className="list-cell-actions">
                    {d.url_sharepoint ? (
                      <a
                        href={d.url_sharepoint}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="icon-btn"
                        title="Abrir no SharePoint"
                      >
                        <Icon name="external" />
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="list-foot">
          <div className="sub">
            Mostrando {filtered.length} de {total} documento
            {total !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </>
  )
}
