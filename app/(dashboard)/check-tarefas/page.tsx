"use client"

// /check-tarefas — CheckTarefas.html (mobile-first check do mestre)
// Lista tarefas em andamento e permite atualizar % rapidamente

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

interface CheckTarefa {
  id_tarefa: number
  nome: string
  id_obra: number
  obra_nome: string
  etapa_nome: string
  status: string
  percentual_concluido: number
  data_inicio: string | null
  data_fim: string | null
}

export default function CheckTarefasPage() {
  const [tarefas, setTarefas] = useState<CheckTarefa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroObra, setFiltroObra] = useState<"todas" | string>("todas")
  const [obsAberta, setObsAberta] = useState<number | null>(null)
  const [observacoes, setObservacoes] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: tarefasRaw } = await supabase
      .from("tarefa")
      .select(
        "id_tarefa, nome, status, percentual_concluido, data_inicio, data_fim, id_obra, id_etapa"
      )
      .neq("status", "concluida")
      .neq("status", "cancelada")
      .order("data_inicio", { ascending: true })

    const list = tarefasRaw ?? []
    const obraIds = Array.from(new Set(list.map((t) => t.id_obra)))
    const etapaIds = Array.from(
      new Set(list.filter((t) => t.id_etapa).map((t) => t.id_etapa!))
    )
    const [{ data: obras }, { data: etapas }] = await Promise.all([
      obraIds.length
        ? supabase
            .from("obra")
            .select("id_obra, nome")
            .in("id_obra", obraIds)
        : Promise.resolve({ data: [] as { id_obra: number; nome: string }[] }),
      etapaIds.length
        ? supabase
            .from("etapa")
            .select("id_etapa, nome")
            .in("id_etapa", etapaIds)
        : Promise.resolve({ data: [] as { id_etapa: number; nome: string }[] }),
    ])
    const obraMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.nome as string])
    )
    const etapaMap = new Map(
      (etapas ?? []).map((e) => [e.id_etapa, e.nome as string])
    )

    setTarefas(
      list.map((t) => ({
        id_tarefa: t.id_tarefa,
        nome: t.nome,
        id_obra: t.id_obra,
        obra_nome: obraMap.get(t.id_obra) ?? "—",
        etapa_nome: t.id_etapa
          ? etapaMap.get(t.id_etapa) ?? "Sem etapa"
          : "Sem etapa",
        status: t.status ?? "pendente",
        percentual_concluido: t.percentual_concluido ?? 0,
        data_inicio: t.data_inicio,
        data_fim: t.data_fim,
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const obras = useMemo(
    () =>
      Array.from(new Set(tarefas.map((t) => t.obra_nome).filter(Boolean))).sort(),
    [tarefas]
  )

  const filtered = useMemo(
    () =>
      tarefas.filter((t) =>
        filtroObra === "todas" ? true : t.obra_nome === filtroObra
      ),
    [tarefas, filtroObra]
  )

  async function setPct(id: number, pct: number) {
    const supabase = createClient()
    const newPct = Math.max(0, Math.min(100, pct))
    setTarefas((prev) =>
      prev.map((t) =>
        t.id_tarefa === id ? { ...t, percentual_concluido: newPct } : t
      )
    )
    const update: Record<string, unknown> = { percentual_concluido: newPct }
    if (newPct === 100) update.status = "concluida"
    const { error } = await supabase
      .from("tarefa")
      .update(update)
      .eq("id_tarefa", id)
    if (error) toast.error("Erro: " + error.message)
    else if (newPct === 100) toast.success("Tarefa concluída ✓")
  }

  const concluidoMedio =
    tarefas.length === 0
      ? 0
      : Math.round(
          tarefas.reduce((a, t) => a + t.percentual_concluido, 0) /
            tarefas.length
        )

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">
              Operacional ·{" "}
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </div>
            <h1>Check de tarefas</h1>
            <div className="subtitle">
              Atualize o % de conclusão das tarefas em andamento. Ideal pra uso
              em campo via celular.
            </div>
          </div>
          <div className="page-head-actions">
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
          </div>
        </div>
        <div
          className="list-kpis"
          style={{
            marginTop: 18,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          }}
        >
          <div className="list-kpi tone-info">
            <div className="list-kpi-label">Tarefas em aberto</div>
            <div className="list-kpi-value">{tarefas.length}</div>
            <div className="list-kpi-sub">Aguardando avanço</div>
          </div>
          <div className="list-kpi tone-success">
            <div className="list-kpi-label">Avanço médio</div>
            <div className="list-kpi-value">{concluidoMedio}%</div>
            <div className="list-kpi-sub">Sobre tarefas filtradas</div>
          </div>
          <div className="list-kpi">
            <div className="list-kpi-label">Obras com tarefa ativa</div>
            <div className="list-kpi-value">{obras.length}</div>
            <div className="list-kpi-sub">Distribuição</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div
          className="card-body"
          style={{
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--ink-muted)",
              }}
            >
              Carregando…
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--ink-muted)",
              }}
            >
              Nenhuma tarefa em aberto.
            </div>
          ) : (
            filtered.map((t) => {
              const done = t.percentual_concluido === 100
              return (
                <div
                  key={t.id_tarefa}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    background: done
                      ? "color-mix(in oklab, var(--success) 6%, var(--surface))"
                      : "var(--surface)",
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        className="mono"
                        style={{ fontSize: 11, color: "var(--ink-muted)" }}
                      >
                        #{String(t.id_tarefa).padStart(3, "0")}
                      </div>
                      <div
                        style={{
                          fontSize: 14.5,
                          fontWeight: 600,
                          color: "var(--ink)",
                          marginTop: 2,
                        }}
                      >
                        {t.nome}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-muted)",
                          marginTop: 4,
                          display: "flex",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <Link
                          href={`/obras/${t.id_obra}`}
                          style={{
                            color: "var(--primary)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Icon
                            name="building"
                            style={{ width: 12, height: 12 }}
                          />
                          {t.obra_nome}
                        </Link>
                        <span>·</span>
                        <span>{t.etapa_nome}</span>
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "right",
                        flexShrink: 0,
                        minWidth: 80,
                      }}
                    >
                      <div
                        className="mono"
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: done
                            ? "var(--success)"
                            : t.percentual_concluido >= 50
                              ? "var(--info)"
                              : "var(--ink-muted)",
                          lineHeight: 1,
                        }}
                      >
                        {t.percentual_concluido}
                        <span style={{ fontSize: 14 }}>%</span>
                      </div>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={t.percentual_concluido}
                    onChange={(e) =>
                      setPct(t.id_tarefa, parseInt(e.target.value, 10))
                    }
                    style={{
                      width: "100%",
                      accentColor: done
                        ? "var(--success)"
                        : "var(--primary)",
                    }}
                  />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(5, 1fr)",
                      gap: 6,
                      marginTop: 8,
                    }}
                  >
                    {[0, 25, 50, 75, 100].map((p) => {
                      const active = t.percentual_concluido === p
                      return (
                        <button
                          key={p}
                          type="button"
                          className={"btn btn-sm " + (active ? "btn-primary" : "btn-ghost")}
                          style={{ height: 32, fontSize: 12 }}
                          onClick={() => setPct(t.id_tarefa, p)}
                        >
                          {p === 100 ? "✓ 100%" : p + "%"}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        setObsAberta(
                          obsAberta === t.id_tarefa ? null : t.id_tarefa
                        )
                      }
                      style={{ fontSize: 12 }}
                    >
                      <Icon name="edit" />
                      {observacoes[t.id_tarefa]
                        ? "Editar observação"
                        : "Adicionar observação"}
                    </button>
                    {obsAberta === t.id_tarefa ? (
                      <textarea
                        rows={2}
                        placeholder="Observação do dia (opcional)…"
                        value={observacoes[t.id_tarefa] ?? ""}
                        onChange={(e) =>
                          setObservacoes((prev) => ({
                            ...prev,
                            [t.id_tarefa]: e.target.value,
                          }))
                        }
                        style={{
                          marginTop: 6,
                          width: "100%",
                          padding: 8,
                          border: "1px solid var(--line)",
                          borderRadius: 6,
                          fontSize: 12.5,
                          fontFamily: "inherit",
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
