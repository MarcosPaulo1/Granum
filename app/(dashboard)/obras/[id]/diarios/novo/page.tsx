"use client"

// Port literal de granum-design/diario-novo-app.jsx + DiarioNovo.html

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
import { ESPECIALIDADE } from "@/lib/constants"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"

interface Escalado {
  id: string
  rawId: number
  init: string
  nome: string
  esp: string
  diaria: number
  id_contrato: number
  status: "integral" | "meia" | "falta_justificada" | "falta"
  obs: string
}

const PRESENCA_OPTS = [
  {
    id: "integral" as const,
    label: "Integral",
    factor: 1,
    color: "var(--success)",
    ink: "var(--success-ink)",
    bg: "var(--success-soft)",
  },
  {
    id: "meia" as const,
    label: "Meia diária",
    factor: 0.5,
    color: "var(--info)",
    ink: "var(--info-ink)",
    bg: "var(--info-soft)",
  },
  {
    id: "falta_justificada" as const,
    label: "Falta justificada",
    factor: 0,
    color: "var(--warning)",
    ink: "var(--warning-ink)",
    bg: "var(--warning-soft)",
  },
  {
    id: "falta" as const,
    label: "Falta",
    factor: 0,
    color: "var(--danger)",
    ink: "var(--danger-ink)",
    bg: "var(--danger-soft)",
  },
]

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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

function getOpt(id: Escalado["status"]) {
  return PRESENCA_OPTS.find((o) => o.id === id) ?? PRESENCA_OPTS[0]
}

export default function DiarioNovoPage() {
  const params = useParams()
  const router = useRouter()
  const { responsavel } = useUser()
  const obraId = Number(params.id)

  const [obraNome, setObraNome] = useState("")
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [origem, setOrigem] = useState<"manual" | "whatsapp" | "plaud">(
    "manual"
  )
  const [conteudo, setConteudo] = useState("")
  const [escalados, setEscalados] = useState<Escalado[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [clima, setClima] = useState<{
    temperatura: number
    condicao: string
    chuva: boolean
    descricao: string
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("obra")
      .select("nome, latitude, longitude")
      .eq("id_obra", obraId)
      .single()
      .then(async ({ data: o }) => {
        if (!o) return
        setObraNome((o as { nome: string }).nome)
        const oo = o as { latitude: number | null; longitude: number | null }
        if (oo.latitude && oo.longitude) {
          try {
            const r = await fetch(
              `/api/clima?lat=${oo.latitude}&lon=${oo.longitude}`
            )
            if (r.ok) setClima(await r.json())
          } catch {
            /* opcional */
          }
        }
      })
  }, [obraId])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("escala")
      .select("id_trabalhador, id_contrato")
      .eq("id_obra", obraId)
      .eq("data_prevista", data)
      .neq("status", "cancelado")
      .then(async ({ data: esc }) => {
        if (!esc || esc.length === 0) {
          setEscalados([])
          return
        }
        const trabIds = esc.map((e) => e.id_trabalhador)
        const contIds = esc.map((e) => e.id_contrato)
        const [{ data: trabs }, { data: cts }] = await Promise.all([
          supabase
            .from("trabalhador")
            .select("id_trabalhador, nome, especialidade")
            .in("id_trabalhador", trabIds),
          supabase
            .from("contrato_trabalho")
            .select("id_contrato, valor_acordado")
            .in("id_contrato", contIds),
        ])
        const trabMap = new Map(
          (trabs ?? []).map((t) => [t.id_trabalhador, t])
        )
        const ctMap = new Map((cts ?? []).map((c) => [c.id_contrato, c]))
        setEscalados(
          esc.map((e) => {
            const t = trabMap.get(e.id_trabalhador) as
              | { nome: string; especialidade: string | null }
              | undefined
            const c = ctMap.get(e.id_contrato) as
              | { valor_acordado: number }
              | undefined
            return {
              id: `T-${String(e.id_trabalhador).padStart(3, "0")}`,
              rawId: e.id_trabalhador,
              init: getInitials(t?.nome ?? ""),
              nome: t?.nome ?? "",
              esp: t?.especialidade ?? "",
              diaria: c?.valor_acordado ?? 0,
              id_contrato: e.id_contrato,
              status: "integral",
              obs: "",
            }
          })
        )
      })
  }, [obraId, data])

  const setStatus = (tid: string, status: Escalado["status"]) =>
    setEscalados((prev) =>
      prev.map((e) => (e.id === tid ? { ...e, status } : e))
    )
  const setObs = (tid: string, obs: string) =>
    setEscalados((prev) =>
      prev.map((e) => (e.id === tid ? { ...e, obs } : e))
    )

  const totalPagar = escalados.reduce(
    (a, t) => a + t.diaria * getOpt(t.status).factor,
    0
  )
  const contagens = PRESENCA_OPTS.reduce(
    (a, o) => {
      a[o.id] = escalados.filter((t) => t.status === o.id).length
      return a
    },
    {} as Record<string, number>
  )

  const conteudoChars = conteudo.length
  const conteudoMin = 30
  const canSave = conteudoChars >= conteudoMin && !submitting

  async function handleSubmit() {
    if (!canSave) return
    setSubmitting(true)
    const supabase = createClient()
    const payload: Record<string, unknown> = {
      id_obra: obraId,
      id_responsavel: responsavel?.id_responsavel ?? null,
      data,
      conteudo,
      origem,
      status_revisao: "pendente",
    }
    if (clima) {
      payload.clima_temperatura = clima.temperatura
      payload.clima_condicao = clima.condicao
      payload.clima_chuva = clima.chuva
      payload.clima_descricao = clima.descricao
    }
    const { data: diario, error: dErr } = await supabase
      .from("diario_obra")
      .insert(payload)
      .select("id_diario")
      .single()
    if (dErr) {
      toast.error("Erro: " + dErr.message)
      setSubmitting(false)
      return
    }
    const diarioId = (diario as { id_diario: number }).id_diario
    const presencas = escalados.map((e) => ({
      id_diario: diarioId,
      id_trabalhador: e.rawId,
      id_contrato: e.id_contrato,
      tipo_presenca: e.status,
      valor_dia: e.diaria * getOpt(e.status).factor,
      observacoes: e.obs || null,
    }))
    if (presencas.length > 0) {
      const { error: pErr } = await supabase.from("presenca").insert(presencas)
      if (pErr) {
        toast.error("Erro nas presenças: " + pErr.message)
        setSubmitting(false)
        return
      }
    }
    toast.success("Diário e presenças registrados")
    router.push(`/obras/${obraId}/diarios`)
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">
              OBR-{String(obraId).padStart(4, "0")} · Diário de obra
            </div>
            <h1>Novo diário — {data.split("-").reverse().join("/")}</h1>
            <div className="subtitle">
              Registre o que foi executado hoje no canteiro. As presenças dos
              trabalhadores escalados são lançadas junto com este diário.
            </div>
          </div>
          <div className="page-head-actions">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => router.back()}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!canSave}
              onClick={handleSubmit}
            >
              <Icon name="check" />
              {submitting
                ? "Salvando…"
                : `Salvar diário${escalados.length > 0 ? ` e ${escalados.length} presenças` : ""}`}
            </button>
          </div>
        </div>
      </div>

      <div className="diario-grid">
        {/* COLUNA 1 — diário */}
        <div>
          <div className="card">
            <div className="card-head">
              <h3>
                <Icon name="fileText" />
                Diário de obra
              </h3>
            </div>
            <div className="form-body">
              <div className="form-row form-row-2">
                <div className="form-field">
                  <label>Data do diário</label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Origem do registro</label>
                  <div className="origem-group">
                    {(
                      [
                        { id: "manual", label: "Manual", icon: "edit" },
                        {
                          id: "whatsapp",
                          label: "WhatsApp",
                          icon: "messageSquare",
                        },
                        { id: "plaud", label: "Plaud", icon: "mic" },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={
                          "origem-btn" + (origem === o.id ? " active" : "")
                        }
                        onClick={() => setOrigem(o.id)}
                      >
                        <Icon name={o.icon} />
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label>
                  Conteúdo do diário <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea
                  rows={10}
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="Descreva as atividades realizadas, materiais, ocorrências…"
                />
                <div className="field-hint" style={{ marginTop: 6 }}>
                  {conteudoChars} caracteres ·{" "}
                  {conteudoChars < conteudoMin
                    ? `Mínimo ${conteudoMin}`
                    : "OK"}
                </div>
              </div>

              {clima ? (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: "var(--info-soft)",
                    color: "var(--info-ink)",
                    fontSize: 12.5,
                  }}
                >
                  <strong>Clima do local · </strong>
                  {Math.round(clima.temperatura)}°C · {clima.condicao}{" "}
                  {clima.chuva ? "· chuva" : ""} — {clima.descricao}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* COLUNA 2 — presenças */}
        <div>
          <div className="card">
            <div className="card-head">
              <h3>
                <Icon name="users" />
                Presenças do dia
              </h3>
              <div className="sub">
                {escalados.length} escalado{escalados.length !== 1 ? "s" : ""}
                {escalados.length > 0
                  ? ` · ${fmtBRL(totalPagar)} a pagar`
                  : ""}
              </div>
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--line)",
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                fontSize: 12,
                color: "var(--ink-muted)",
              }}
            >
              {PRESENCA_OPTS.map((o) => (
                <span
                  key={o.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: o.color,
                    }}
                  />
                  {o.label}
                  <span
                    className="mono"
                    style={{
                      background: o.bg,
                      color: o.ink,
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {contagens[o.id] ?? 0}
                  </span>
                </span>
              ))}
            </div>

            {escalados.length === 0 ? (
              <div
                style={{
                  padding: "60px 24px",
                  textAlign: "center",
                  color: "var(--ink-muted)",
                  fontSize: 13.5,
                }}
              >
                Nenhum trabalhador escalado para esta data. Use a aba Equipe da
                obra para escalar.
              </div>
            ) : (
              <div>
                {escalados.map((t) => {
                  const opt = getOpt(t.status)
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(180px, 1.2fr) 1fr minmax(140px, auto)",
                        gap: 12,
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--line)",
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span className="avatar-sm">{t.init}</span>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--ink)",
                            }}
                          >
                            {t.nome}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: "var(--ink-muted)",
                            }}
                          >
                            {(ESPECIALIDADE as Record<string, string>)[t.esp] ??
                              t.esp}{" "}
                            ·{" "}
                            <span className="mono">{fmtBRL(t.diaria)}</span>/dia
                          </div>
                        </div>
                      </div>
                      <div>
                        <div
                          className="seg"
                          style={{ marginBottom: 6, gap: 0 }}
                        >
                          {PRESENCA_OPTS.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              className={
                                "seg-btn" +
                                (t.status === o.id ? " active" : "")
                              }
                              style={{
                                fontSize: 11.5,
                                padding: "0 8px",
                                ...(t.status === o.id
                                  ? { background: o.bg, color: o.ink }
                                  : {}),
                              }}
                              onClick={() => setStatus(t.id, o.id)}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                        <input
                          className="input"
                          style={{ height: 30, fontSize: 12 }}
                          placeholder="Observação (opcional)"
                          value={t.obs}
                          onChange={(e) => setObs(t.id, e.target.value)}
                        />
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: 13,
                          fontWeight: 500,
                          color:
                            opt.factor > 0
                              ? "var(--ink)"
                              : "var(--ink-muted)",
                        }}
                      >
                        <div className="mono">
                          {fmtBRL(t.diaria * opt.factor)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--ink-muted)",
                            marginTop: 2,
                          }}
                        >
                          {opt.factor === 0 ? "Sem custo" : `${opt.factor}x`}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div
                  style={{
                    padding: "12px 16px",
                    background: "var(--surface-muted)",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  <span>Total a pagar do dia</span>
                  <span className="mono fin-neg">{fmtBRL(totalPagar)}</span>
                </div>
              </div>
            )}
          </div>

          {obraNome ? (
            <div className="sub" style={{ marginTop: 8 }}>
              Obra: {obraNome}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
