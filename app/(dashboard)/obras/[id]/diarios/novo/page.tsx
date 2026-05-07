"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  ArrowLeft,
  CloudSun,
  FileText,
  HardHat,
  Loader2,
  Save,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ESPECIALIDADE, PRESENCA_TIPO } from "@/lib/constants"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { formatBRL } from "@/lib/utils/format"

interface Escalado {
  id_trabalhador: number
  nome: string
  especialidade: string | null
  id_contrato: number
  valor_acordado: number
  tipo_presenca: string
  observacoes: string
}

const PRESENCA_TONE: Record<
  string,
  "success" | "warning" | "danger" | "neutral"
> = {
  integral: "success",
  meia: "warning",
  falta_justificada: "neutral",
  falta: "danger",
}

export default function NovoDiarioPage() {
  const params = useParams()
  const router = useRouter()
  const { responsavel } = useUser()
  const obraId = Number(params.id)

  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [conteudo, setConteudo] = useState("")
  const [origem, setOrigem] = useState("manual")
  const [escalados, setEscalados] = useState<Escalado[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clima, setClima] = useState<{
    temperatura: number
    condicao: string
    chuva: boolean
    descricao: string
  } | null>(null)
  const [climaLoading, setClimaLoading] = useState(false)
  const [obraNome, setObraNome] = useState("")

  useEffect(() => {
    loadEscalados()
    loadClima()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("obra")
      .select("nome")
      .eq("id_obra", obraId)
      .single()
      .then(({ data }) => {
        if (data) setObraNome((data as { nome: string }).nome)
      })
  }, [obraId])

  async function loadClima() {
    const supabase = createClient()
    const { data: obra } = await supabase
      .from("obra")
      .select("latitude, longitude")
      .eq("id_obra", obraId)
      .single()
    const obraData = obra as
      | { latitude: number | null; longitude: number | null }
      | null
    if (!obraData?.latitude || !obraData?.longitude) return

    setClimaLoading(true)
    try {
      const res = await fetch(
        `/api/clima?lat=${obraData.latitude}&lon=${obraData.longitude}`
      )
      if (res.ok) {
        const climaData = await res.json()
        setClima(climaData)
      }
    } catch {
      /* clima opcional */
    }
    setClimaLoading(false)
  }

  async function loadEscalados() {
    const supabase = createClient()
    const { data: esc } = await supabase
      .from("escala")
      .select("id_trabalhador, id_contrato")
      .eq("id_obra", obraId)
      .eq("data_prevista", data)
      .neq("status", "cancelado")
    const escalaList = (esc ?? []) as {
      id_trabalhador: number
      id_contrato: number
    }[]

    if (escalaList.length === 0) {
      setEscalados([])
      return
    }

    const trabIds = escalaList.map((e) => e.id_trabalhador)
    const contIds = escalaList.map((e) => e.id_contrato)

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
      (trabs ?? []).map(
        (t: {
          id_trabalhador: number
          nome: string
          especialidade: string | null
        }) => [t.id_trabalhador, t]
      )
    )
    const ctMap = new Map(
      (cts ?? []).map(
        (c: { id_contrato: number; valor_acordado: number }) => [
          c.id_contrato,
          c,
        ]
      )
    )

    setEscalados(
      escalaList.map((e) => {
        const t = trabMap.get(e.id_trabalhador) as
          | { nome: string; especialidade: string | null }
          | undefined
        const c = ctMap.get(e.id_contrato) as
          | { valor_acordado: number }
          | undefined
        return {
          id_trabalhador: e.id_trabalhador,
          nome: t?.nome ?? "",
          especialidade: t?.especialidade ?? null,
          id_contrato: e.id_contrato,
          valor_acordado: c?.valor_acordado ?? 0,
          tipo_presenca: "integral",
          observacoes: "",
        }
      })
    )
  }

  function calcValor(e: Escalado): number {
    if (e.tipo_presenca === "integral") return e.valor_acordado
    if (e.tipo_presenca === "meia") return e.valor_acordado / 2
    return 0
  }

  function updatePresenca(index: number, field: string, value: string) {
    setEscalados((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    )
  }

  async function handleSubmit() {
    if (!conteudo.trim()) {
      toast.error("Conteúdo do diário é obrigatório")
      return
    }
    if (escalados.length === 0) {
      toast.error("Nenhum trabalhador escalado para este dia")
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    const diarioPayload: Record<string, unknown> = {
      id_obra: obraId,
      id_responsavel: responsavel?.id_responsavel ?? null,
      data,
      conteudo,
      origem,
      status_revisao: "pendente",
    }
    if (clima) {
      diarioPayload.clima_temperatura = clima.temperatura
      diarioPayload.clima_condicao = clima.condicao
      diarioPayload.clima_chuva = clima.chuva
      diarioPayload.clima_descricao = clima.descricao
    }

    const { data: diario, error: dErr } = await supabase
      .from("diario_obra")
      .insert(diarioPayload)
      .select("id_diario")
      .single()

    if (dErr) {
      toast.error("Erro ao criar diário: " + dErr.message)
      setIsSubmitting(false)
      return
    }

    const diarioId = (diario as { id_diario: number }).id_diario

    const presencas = escalados.map((e) => ({
      id_diario: diarioId,
      id_trabalhador: e.id_trabalhador,
      id_contrato: e.id_contrato,
      tipo_presenca: e.tipo_presenca,
      valor_dia: calcValor(e),
      observacoes: e.observacoes || null,
    }))

    const { error: pErr } = await supabase.from("presenca").insert(presencas)
    if (pErr) {
      toast.error("Erro ao registrar presenças: " + pErr.message)
      setIsSubmitting(false)
      return
    }

    toast.success("Diário e presenças registrados")
    router.push(`/obras/${obraId}/diarios`)
  }

  const totalDia = escalados.reduce((s, e) => s + calcValor(e), 0)
  const presentes = escalados.filter(
    (e) => e.tipo_presenca === "integral" || e.tipo_presenca === "meia"
  ).length
  const faltas = escalados.filter(
    (e) => e.tipo_presenca === "falta" || e.tipo_presenca === "falta_justificada"
  ).length

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link
          href={`/obras/${obraId}/diarios`}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Diários
        </Link>
        <span>·</span>
        <span>{obraNome || `OBR-${obraId}`}</span>
      </div>

      <PageHeader
        eyebrow={`Obra · Diário · ${data.split("-").reverse().join("/")}`}
        title="Novo diário de obra"
        subtitle="Registre as atividades do dia e a presença dos trabalhadores escalados"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 py-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Informações do diário
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Data
                  </Label>
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Origem
                  </Label>
                  <Select
                    value={origem}
                    onValueChange={(v) => v && setOrigem(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="plaud">Plaud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Conteúdo do diário *
                </Label>
                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  rows={8}
                  placeholder="Descreva as atividades realizadas, ocorrências…"
                  className="resize-y"
                />
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Diário será criado com status <strong>pendente</strong> de
                  revisão.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-foreground">
                  Presenças do dia
                </h3>
                <span className="mono text-[13px] font-semibold tabular-nums text-foreground">
                  Total: {formatBRL(totalDia)}
                </span>
              </div>

              {escalados.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
                  <Users className="mx-auto size-6 text-muted-foreground/60" />
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    Nenhum trabalhador escalado para{" "}
                    <span className="mono tabular-nums">
                      {data.split("-").reverse().join("/")}
                    </span>
                    .
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    Escale trabalhadores na aba Equipe da obra.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {escalados.map((e, i) => (
                    <div
                      key={e.id_trabalhador}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar variant="pf" name={e.nome} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-medium text-foreground">
                              {e.nome}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">
                              {e.especialidade
                                ? (ESPECIALIDADE as Record<string, string>)[
                                    e.especialidade
                                  ] ?? e.especialidade
                                : "—"}
                              <span className="mono ml-2 tabular-nums">
                                {formatBRL(e.valor_acordado)}/dia
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Select
                            value={e.tipo_presenca}
                            onValueChange={(v) =>
                              v && updatePresenca(i, "tipo_presenca", v)
                            }
                          >
                            <SelectTrigger className="h-8 w-44 text-[12px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PRESENCA_TIPO).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {(v as { label: string }).label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <CategoryChip
                            tone={PRESENCA_TONE[e.tipo_presenca] ?? "neutral"}
                          >
                            <span className="mono tabular-nums">
                              {formatBRL(calcValor(e))}
                            </span>
                          </CategoryChip>
                        </div>
                      </div>
                      <Input
                        className="mt-2 h-8 text-[12.5px]"
                        placeholder="Observações sobre a presença (opcional)…"
                        value={e.observacoes}
                        onChange={(ev) =>
                          updatePresenca(i, "observacoes", ev.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save data-icon="inline-start" />
              )}
              Salvar diário e presenças
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <KpiGrid cols={2}>
            <KpiCard
              tone="info"
              label="Escalados"
              value={escalados.length}
              icon={<HardHat />}
            />
            <KpiCard
              tone="success"
              label="Presentes"
              value={presentes}
              icon={<Users />}
            />
            <KpiCard
              tone={faltas > 0 ? "danger" : "neutral"}
              label="Faltas"
              value={faltas}
            />
            <KpiCard
              label="Total"
              value={formatBRL(totalDia)}
              sub="Custo do dia"
            />
          </KpiGrid>

          <Card>
            <CardContent className="space-y-2 py-5">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <CloudSun className="size-4" />
                Clima do dia
              </div>
              {climaLoading ? (
                <p className="text-[12.5px] text-muted-foreground">
                  Buscando previsão…
                </p>
              ) : clima ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="mono text-2xl font-semibold tabular-nums text-foreground">
                      {Math.round(clima.temperatura)}°C
                    </span>
                    <CategoryChip
                      tone={clima.chuva ? "info" : "neutral"}
                    >
                      {clima.condicao}
                    </CategoryChip>
                  </div>
                  <p className="text-[12.5px] text-muted-foreground">
                    {clima.descricao}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Salvo automaticamente junto com o diário.
                  </p>
                </div>
              ) : (
                <p className="text-[12.5px] text-muted-foreground">
                  Coordenadas da obra não configuradas. Defina latitude e
                  longitude na obra para captura automática do clima.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 py-5">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <FileText className="size-4" />
                Lembretes
              </div>
              <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
                <li>· Diário entra em revisão pendente</li>
                <li>· Presenças geram folha semanal automaticamente</li>
                <li>· Falta justificada não desconta o valor</li>
                <li>· Meia presença = ½ do valor acordado</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
