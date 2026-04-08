"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared/status-badge"
import { ProgressBar } from "@/components/shared/progress-bar"
import { ObraForm } from "@/components/forms/obra-form"
import { TarefasTab } from "@/components/obra-tabs/tarefas-tab"
import { EquipeTab } from "@/components/obra-tabs/equipe-tab"
import { FinanceiroTab } from "@/components/obra-tabs/financeiro-tab"
import { DocumentosTab } from "@/components/obra-tabs/documentos-tab"
import { DiariosTab } from "@/components/obra-tabs/diarios-tab"
import { OBRA_STATUS, TAREFA_STATUS } from "@/lib/constants"
import { formatBRL, formatDate } from "@/lib/utils/format"
import { Pencil } from "lucide-react"

interface Obra {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  descricao: string | null
  endereco: string | null
  data_inicio_prevista: string | null
  data_fim_prevista: string | null
  data_inicio_real: string | null
  id_cliente: number
  id_centro_custo: number | null
  id_responsavel: number | null
}

export default function ObraPainelPage() {
  const params = useParams()
  const router = useRouter()
  const { role } = useUser()
  const [obra, setObra] = useState<Obra | null>(null)
  const [clienteNome, setClienteNome] = useState("")
  const [responsavelNome, setResponsavelNome] = useState("")
  const [tarefas, setTarefas] = useState<{ id_tarefa: number; nome: string; status: string; percentual_concluido: number }[]>([])
  const [kpis, setKpis] = useState({ planejado: 0, realizado: 0, nTarefas: 0, nTrabalhadores: 0 })
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: o } = await supabase.from("obra").select("*").eq("id_obra", id).single()
    if (!o) return
    setObra(o as Obra)

    const { data: cli } = await supabase.from("cliente").select("nome").eq("id_cliente", o.id_cliente).single()
    setClienteNome((cli as { nome: string } | null)?.nome ?? "")

    if (o.id_responsavel) {
      const { data: resp } = await supabase.from("responsavel").select("nome").eq("id_responsavel", o.id_responsavel).single()
      setResponsavelNome((resp as { nome: string } | null)?.nome ?? "")
    }

    const { data: tarefasData } = await supabase.from("tarefa").select("id_tarefa, nome, status, percentual_concluido").eq("id_obra", id).order("ordem")
    setTarefas((tarefasData ?? []) as typeof tarefas)

    // KPIs financeiros
    const { data: lancs } = await supabase.from("lancamento").select("valor, tipo").eq("id_obra", id)
    const lancsList = (lancs ?? []) as { valor: number; tipo: string }[]
    const planejado = lancsList.filter(l => l.tipo === "planejado").reduce((s, l) => s + l.valor, 0)
    const realizado = lancsList.filter(l => l.tipo === "realizado").reduce((s, l) => s + l.valor, 0)

    const { data: contratos } = await supabase.from("contrato_trabalho").select("id_trabalhador").eq("id_obra", id).eq("status", "ativo")
    const uniqueWorkers = new Set((contratos ?? []).map((c: { id_trabalhador: number }) => c.id_trabalhador))

    setKpis({
      planejado,
      realizado,
      nTarefas: (tarefasData ?? []).length,
      nTrabalhadores: uniqueWorkers.size,
    })
  }

  useEffect(() => { load() }, [params.id])

  if (!obra) return <p>Carregando...</p>

  const canEdit = role === "diretor" || role === "engenheiro"
  const variacao = kpis.planejado > 0 ? ((kpis.realizado - kpis.planejado) / kpis.planejado * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{obra.nome}</h1>
          <p className="text-muted-foreground text-sm">Cliente: {clienteNome} | Responsável: {responsavelNome}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={obra.status} statusMap={OBRA_STATUS} />
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
        </div>
      </div>

      <ProgressBar value={obra.percentual_finalizada} />

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="diarios">Diários</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Planejado</p><p className="text-xl font-mono font-semibold">{formatBRL(kpis.planejado)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Realizado</p><p className="text-xl font-mono font-semibold">{formatBRL(kpis.realizado)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Variação</p><p className={`text-xl font-mono font-semibold ${variacao > 0 ? "text-red-600" : "text-green-600"}`}>{variacao.toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Tarefas / Trabalhadores</p><p className="text-xl font-semibold">{kpis.nTarefas} / {kpis.nTrabalhadores}</p></CardContent></Card>
          </div>

          {/* Info */}
          <Card>
            <CardContent className="pt-4 grid gap-2 text-sm">
              {obra.endereco && <p><strong>Endereço:</strong> {obra.endereco}</p>}
              {obra.data_inicio_prevista && <p><strong>Início previsto:</strong> {formatDate(obra.data_inicio_prevista)}</p>}
              {obra.data_fim_prevista && <p><strong>Fim previsto:</strong> {formatDate(obra.data_fim_prevista)}</p>}
              {obra.descricao && <p><strong>Descrição:</strong> {obra.descricao}</p>}
            </CardContent>
          </Card>

          {/* Próximas tarefas */}
          <div>
            <h3 className="font-semibold mb-2">Próximas tarefas</h3>
            {tarefas.filter(t => t.status !== "concluida" && t.status !== "cancelada").slice(0, 5).map(t => (
              <div key={t.id_tarefa} className="flex items-center justify-between border rounded p-2 mb-1">
                <span className="text-sm">{t.nome}</span>
                <div className="flex items-center gap-2">
                  <ProgressBar value={t.percentual_concluido} className="w-20" />
                  <StatusBadge status={t.status} statusMap={TAREFA_STATUS} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tarefas" className="mt-4">
          <TarefasTab obraId={obra.id_obra} role={role} />
        </TabsContent>

        <TabsContent value="equipe" className="mt-4">
          <EquipeTab obraId={obra.id_obra} />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <FinanceiroTab obraId={obra.id_obra} />
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <DocumentosTab obraId={obra.id_obra} />
        </TabsContent>

        <TabsContent value="diarios" className="mt-4">
          <DiariosTab obraId={obra.id_obra} role={role} />
        </TabsContent>
      </Tabs>

      <ObraForm open={formOpen} onOpenChange={setFormOpen} obra={obra as unknown as Record<string, unknown>} onSuccess={load} />
    </div>
  )
}
