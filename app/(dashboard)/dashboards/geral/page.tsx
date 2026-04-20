"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { ProgressBar } from "@/components/shared/progress-bar"
import { OBRA_STATUS } from "@/lib/constants"
import { formatBRL } from "@/lib/utils/format"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

interface ObraDashboard {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  data_inicio_prevista: string | null
  data_fim_prevista: string | null
  cliente: string
  responsavel: string | null
  total_planejado: number
  total_realizado: number
  tarefas_atrasadas: number
  pendencias_abertas: number
  trabalhadores_ativos: number
}

type Semaforo = "verde" | "amarelo" | "vermelho"

function calcularSemaforo(obra: ObraDashboard): Semaforo {
  const desvio = obra.total_planejado > 0
    ? ((obra.total_realizado - obra.total_planejado) / obra.total_planejado) * 100
    : 0
  const atrasadas = obra.tarefas_atrasadas

  if (desvio > 20 || atrasadas >= 3) return "vermelho"
  if (desvio > 10 || atrasadas >= 1) return "amarelo"
  return "verde"
}

const SEMAFORO_CONFIG = {
  verde: { label: "Saudável", bg: "border-l-4 border-l-green-500", icon: CheckCircle, iconColor: "text-green-500" },
  amarelo: { label: "Atenção", bg: "border-l-4 border-l-yellow-500", icon: AlertCircle, iconColor: "text-yellow-500" },
  vermelho: { label: "Crítico", bg: "border-l-4 border-l-red-500", icon: AlertTriangle, iconColor: "text-red-500" },
}

export default function DashboardGeralPage() {
  const router = useRouter()
  const [obras, setObras] = useState<ObraDashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("vw_dashboard_obras").select("*")

    if (error) {
      console.error("Erro ao carregar dashboard:", error)
      // Fallback: query manual se a view não existir ainda
      const { data: obrasRaw } = await supabase
        .from("obra")
        .select("id_obra, nome, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista, id_cliente, id_responsavel")
        .neq("status", "cancelada")

      if (obrasRaw) {
        const clienteIds = [...new Set(obrasRaw.map((o: { id_cliente: number }) => o.id_cliente))]
        const respIds = [...new Set(obrasRaw.filter((o: { id_responsavel: number | null }) => o.id_responsavel).map((o: { id_responsavel: number }) => o.id_responsavel))]

        const [{ data: clientes }, { data: resps }] = await Promise.all([
          supabase.from("cliente").select("id_cliente, nome").in("id_cliente", clienteIds.length ? clienteIds : [0]),
          supabase.from("responsavel").select("id_responsavel, nome").in("id_responsavel", respIds.length ? respIds : [0]),
        ])

        const cliMap = new Map((clientes ?? []).map((c: { id_cliente: number; nome: string }) => [c.id_cliente, c.nome]))
        const respMap = new Map((resps ?? []).map((r: { id_responsavel: number; nome: string }) => [r.id_responsavel, r.nome]))

        setObras(obrasRaw.map((o: { id_obra: number; nome: string; status: string; percentual_finalizada: number; data_inicio_prevista: string | null; data_fim_prevista: string | null; id_cliente: number; id_responsavel: number | null }) => ({
          id_obra: o.id_obra,
          nome: o.nome,
          status: o.status,
          percentual_finalizada: o.percentual_finalizada,
          data_inicio_prevista: o.data_inicio_prevista,
          data_fim_prevista: o.data_fim_prevista,
          cliente: cliMap.get(o.id_cliente) ?? "",
          responsavel: o.id_responsavel ? respMap.get(o.id_responsavel) ?? null : null,
          total_planejado: 0,
          total_realizado: 0,
          tarefas_atrasadas: 0,
          pendencias_abertas: 0,
          trabalhadores_ativos: 0,
        })))
      }
    } else {
      setObras((data ?? []) as ObraDashboard[])
    }

    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (isLoading) return <PageSkeleton />

  const totalPlanejado = obras.reduce((s, o) => s + o.total_planejado, 0)
  const totalRealizado = obras.reduce((s, o) => s + o.total_realizado, 0)
  const totalTrabalhadores = obras.reduce((s, o) => s + o.trabalhadores_ativos, 0)
  const obrasAtivas = obras.filter(o => o.status === "em_andamento").length

  const semaforos = obras.map(o => ({ ...o, semaforo: calcularSemaforo(o) }))
  const countVerde = semaforos.filter(o => o.semaforo === "verde").length
  const countAmarelo = semaforos.filter(o => o.semaforo === "amarelo").length
  const countVermelho = semaforos.filter(o => o.semaforo === "vermelho").length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Visão geral</h1>

      {/* KPIs globais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Obras ativas</p>
            <p className="text-2xl font-semibold">{obrasAtivas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total planejado</p>
            <p className="text-xl font-mono font-semibold">{formatBRL(totalPlanejado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total realizado</p>
            <p className="text-xl font-mono font-semibold">{formatBRL(totalRealizado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Trabalhadores ativos</p>
            <p className="text-2xl font-semibold">{totalTrabalhadores}</p>
          </CardContent>
        </Card>
      </div>

      {/* Semáforo resumo */}
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /> {countVerde} saudável</span>
        <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4 text-yellow-500" /> {countAmarelo} atenção</span>
        <span className="flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-red-500" /> {countVermelho} crítico</span>
      </div>

      {/* Grid de cards por obra */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {semaforos.map((obra) => {
          const config = SEMAFORO_CONFIG[obra.semaforo]
          const SemaforoIcon = config.icon
          const desvio = obra.total_planejado > 0
            ? ((obra.total_realizado - obra.total_planejado) / obra.total_planejado * 100)
            : 0

          return (
            <Card
              key={obra.id_obra}
              className={`cursor-pointer hover:shadow-md transition-shadow ${config.bg}`}
              onClick={() => router.push(`/obras/${obra.id_obra}`)}
            >
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{obra.nome}</p>
                    <p className="text-xs text-muted-foreground">{obra.cliente}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SemaforoIcon className={`h-5 w-5 ${config.iconColor}`} />
                    <StatusBadge status={obra.status} statusMap={OBRA_STATUS} />
                  </div>
                </div>

                <ProgressBar value={obra.percentual_finalizada} />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Planejado</p>
                    <p className="font-mono font-medium">{formatBRL(obra.total_planejado)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Realizado</p>
                    <p className="font-mono font-medium">{formatBRL(obra.total_realizado)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Desvio</p>
                    <p className={`font-mono font-medium ${desvio > 0 ? "text-red-600" : "text-green-600"}`}>
                      {desvio.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Responsável</p>
                    <p className="font-medium truncate">{obra.responsavel ?? "—"}</p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs border-t pt-2">
                  {obra.tarefas_atrasadas > 0 && (
                    <span className="text-red-600 font-medium">{obra.tarefas_atrasadas} tarefa(s) atrasada(s)</span>
                  )}
                  {obra.pendencias_abertas > 0 && (
                    <span className="text-orange-600 font-medium">{obra.pendencias_abertas} pendência(s)</span>
                  )}
                  {obra.tarefas_atrasadas === 0 && obra.pendencias_abertas === 0 && (
                    <span className="text-green-600">Sem alertas</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {obras.length === 0 && (
        <p className="text-muted-foreground text-sm">Nenhuma obra encontrada.</p>
      )}
    </div>
  )
}
