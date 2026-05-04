"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Hammer,
  Users,
} from "lucide-react"

import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { ObraSelector } from "@/components/shared/obra-selector"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface AlocRow {
  id_obra: number
  obra: string
  data_prevista: string
  id_trabalhador: number
  trabalhador: string
  especialidade: string | null
  turno: string
  status_escala: string
  tipo_presenca: string | null
  situacao: string
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function cellStyle(situacao: string) {
  if (situacao === "presente")
    return "bg-[var(--success-soft)] text-[var(--success-ink)] border-[var(--success)]/30"
  if (situacao === "ausente")
    return "bg-[var(--danger-soft)] text-[var(--danger-ink)] border-[var(--danger)]/30"
  if (situacao === "futuro")
    return "bg-[var(--info-soft)] text-[var(--info-ink)] border-[var(--info)]/30 [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(59,130,246,0.08)_4px,rgba(59,130,246,0.08)_8px)]"
  return "bg-muted/40 text-muted-foreground/60 border-border/50"
}

function cellLabel(situacao: string) {
  if (situacao === "presente") return "Presente"
  if (situacao === "ausente") return "Falta"
  if (situacao === "futuro") return "Planejado"
  return "—"
}

export default function AlocacaoPage() {
  const [obraId, setObraId] = useState<number>(0)
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [data, setData] = useState<AlocRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const days = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const load = useCallback(async () => {
    if (!obraId) {
      setData([])
      return
    }
    setIsLoading(true)
    const supabase = createClient()
    const from = format(weekStart, "yyyy-MM-dd")
    const to = format(addDays(weekStart, 5), "yyyy-MM-dd")
    const { data: rows } = await supabase
      .from("vw_alocacao_diaria")
      .select("*")
      .eq("id_obra", obraId)
      .gte("data_prevista", from)
      .lte("data_prevista", to)
    setData((rows ?? []) as AlocRow[])
    setIsLoading(false)
  }, [obraId, weekStart])

  useEffect(() => {
    load()
  }, [load])

  const trabalhadores = useMemo(() => {
    const map = new Map<
      number,
      { id: number; nome: string; especialidade: string | null }
    >()
    for (const r of data) {
      if (!map.has(r.id_trabalhador)) {
        map.set(r.id_trabalhador, {
          id: r.id_trabalhador,
          nome: r.trabalhador,
          especialidade: r.especialidade,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR")
    )
  }, [data])

  function situacao(trabId: number, day: Date) {
    const dateStr = format(day, "yyyy-MM-dd")
    return (
      data.find(
        (r) => r.id_trabalhador === trabId && r.data_prevista === dateStr
      )?.situacao ?? ""
    )
  }

  const totalPorDia = days.map((d) => {
    const dateStr = format(d, "yyyy-MM-dd")
    return data.filter((r) => r.data_prevista === dateStr && r.situacao !== "")
      .length
  })

  const presentes = data.filter((r) => r.situacao === "presente").length
  const ausentes = data.filter((r) => r.situacao === "ausente").length
  const futuros = data.filter((r) => r.situacao === "futuro").length
  const realizadas = presentes + ausentes
  const taxaPresenca =
    realizadas > 0 ? Math.round((presentes * 100) / realizadas) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relatórios · Equipe"
        title="Painel de alocação"
        subtitle={`Semana de ${format(weekStart, "dd/MM", { locale: ptBR })} a ${format(addDays(weekStart, 5), "dd/MM/yyyy", { locale: ptBR })}`}
        actions={
          <>
            <ObraSelector
              value={obraId || undefined}
              onValueChange={setObraId}
              className="w-64"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              aria-label="Semana anterior"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              aria-label="Próxima semana"
            >
              <ChevronRight />
            </Button>
          </>
        }
      />

      {!obraId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Calendar className="size-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Selecione uma obra para ver a alocação semanal.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Carregando alocação…
          </CardContent>
        </Card>
      ) : (
        <>
          <KpiGrid cols={4}>
            <KpiCard
              label="Trabalhadores na semana"
              value={trabalhadores.length}
              sub="Distintos com escala"
              icon={<Users />}
            />
            <KpiCard
              tone="info"
              label="Alocações"
              value={data.length}
              sub={`${presentes} presenças · ${futuros} planejadas`}
              icon={<Hammer />}
            />
            <KpiCard
              tone={
                taxaPresenca >= 85
                  ? "success"
                  : taxaPresenca >= 60
                    ? "warning"
                    : "danger"
              }
              label="Taxa de presença"
              value={`${taxaPresenca}%`}
              sub={`${presentes} de ${realizadas} já realizadas`}
            />
            <KpiCard
              tone={ausentes > 3 ? "danger" : ausentes > 0 ? "warning" : "neutral"}
              label="Faltas"
              value={ausentes}
              sub={ausentes === 0 ? "Sem faltas registradas" : "Sem justificativa"}
              icon={<AlertTriangle />}
            />
          </KpiGrid>

          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="sticky left-0 z-10 min-w-[240px] bg-muted/60 px-5 py-2.5 text-left font-semibold">
                      Trabalhador
                    </th>
                    {days.map((d, i) => (
                      <th
                        key={d.toISOString()}
                        className="min-w-[110px] px-3 py-2.5 text-center font-semibold"
                      >
                        <div>{DAY_LABELS[i]}</div>
                        <div className="text-[10px] font-normal text-muted-foreground/70 tabular-nums">
                          {format(d, "dd/MM")}
                        </div>
                      </th>
                    ))}
                    <th className="min-w-[80px] px-3 py-2.5 text-center font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trabalhadores.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-16 text-center text-sm text-muted-foreground"
                      >
                        Nenhuma alocação nesta semana.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {trabalhadores.map((t) => {
                        const semana = days.map((d) => situacao(t.id, d))
                        const totalDias = semana.filter((s) => s !== "").length
                        return (
                          <tr
                            key={t.id}
                            className="border-b border-border last:border-b-0 hover:bg-muted/20"
                          >
                            <td className="sticky left-0 z-10 bg-card px-5 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  variant="pf"
                                  name={t.nome}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-medium text-foreground">
                                    {t.nome}
                                  </div>
                                  <div className="text-[11.5px] text-muted-foreground">
                                    {t.especialidade ?? "—"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {semana.map((sit, i) => (
                              <td key={i} className="p-1.5 text-center">
                                <div
                                  className={cn(
                                    "flex h-9 items-center justify-center rounded border text-[11px] font-medium",
                                    cellStyle(sit)
                                  )}
                                  title={cellLabel(sit)}
                                >
                                  {sit === "presente"
                                    ? "✓"
                                    : sit === "ausente"
                                      ? "✕"
                                      : sit === "futuro"
                                        ? "·"
                                        : ""}
                                </div>
                              </td>
                            ))}
                            <td className="px-3 py-3 text-center">
                              <span className="mono text-[13px] font-medium tabular-nums text-foreground">
                                {totalDias}/6
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="border-t-2 border-border bg-muted/40 font-semibold">
                        <td className="sticky left-0 z-10 bg-muted/40 px-5 py-3 text-[13px] text-foreground">
                          Total / dia
                        </td>
                        {totalPorDia.map((t, i) => (
                          <td key={i} className="px-3 py-3 text-center">
                            <span className="mono text-[12.5px] font-semibold tabular-nums text-foreground">
                              {t}
                            </span>
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center">
                          <span className="mono text-[13px] font-bold tabular-nums text-foreground">
                            {data.length}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-3 text-[11.5px] text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Legenda:</span>
              <CategoryChip tone="success">
                <span className="size-1.5 rounded-full bg-[var(--success)]" />
                Presente
              </CategoryChip>
              <CategoryChip tone="danger">
                <span className="size-1.5 rounded-full bg-destructive" />
                Falta
              </CategoryChip>
              <CategoryChip tone="info">
                <span className="size-1.5 rounded-full bg-[var(--info)]" />
                Planejado
              </CategoryChip>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
