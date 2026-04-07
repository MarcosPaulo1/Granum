"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/use-user"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PRESENCA_TIPO, ESPECIALIDADE } from "@/lib/constants"
import { formatBRL } from "@/lib/utils/format"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

interface Escalado {
  id_trabalhador: number
  nome: string
  especialidade: string | null
  id_contrato: number
  valor_acordado: number
  tipo_presenca: string
  observacoes: string
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

  useEffect(() => {
    loadEscalados()
  }, [data])

  async function loadEscalados() {
    const supabase = createClient()

    // Buscar trabalhadores escalados para o dia na obra
    const { data: esc } = await supabase.from("escala").select("id_trabalhador, id_contrato").eq("id_obra", obraId).eq("data_prevista", data).neq("status", "cancelado")
    const escalaList = (esc ?? []) as { id_trabalhador: number; id_contrato: number }[]

    if (escalaList.length === 0) { setEscalados([]); return }

    const trabIds = escalaList.map(e => e.id_trabalhador)
    const contIds = escalaList.map(e => e.id_contrato)

    const [{ data: trabs }, { data: cts }] = await Promise.all([
      supabase.from("trabalhador").select("id_trabalhador, nome, especialidade").in("id_trabalhador", trabIds),
      supabase.from("contrato_trabalho").select("id_contrato, valor_acordado").in("id_contrato", contIds),
    ])

    const trabMap = new Map((trabs ?? []).map((t: { id_trabalhador: number; nome: string; especialidade: string | null }) => [t.id_trabalhador, t]))
    const ctMap = new Map((cts ?? []).map((c: { id_contrato: number; valor_acordado: number }) => [c.id_contrato, c]))

    setEscalados(escalaList.map(e => {
      const t = trabMap.get(e.id_trabalhador) as { nome: string; especialidade: string | null } | undefined
      const c = ctMap.get(e.id_contrato) as { valor_acordado: number } | undefined
      return {
        id_trabalhador: e.id_trabalhador,
        nome: t?.nome ?? "",
        especialidade: t?.especialidade ?? null,
        id_contrato: e.id_contrato,
        valor_acordado: c?.valor_acordado ?? 0,
        tipo_presenca: "integral",
        observacoes: "",
      }
    }))
  }

  function calcValor(e: Escalado): number {
    if (e.tipo_presenca === "integral") return e.valor_acordado
    if (e.tipo_presenca === "meia") return e.valor_acordado / 2
    return 0
  }

  function updatePresenca(index: number, field: string, value: string) {
    setEscalados(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  async function handleSubmit() {
    if (!conteudo.trim()) { toast.error("Conteúdo do diário é obrigatório"); return }
    if (escalados.length === 0) { toast.error("Nenhum trabalhador escalado para este dia"); return }

    setIsSubmitting(true)
    const supabase = createClient()

    // Criar diário
    const { data: diario, error: dErr } = await supabase.from("diario_obra").insert({
      id_obra: obraId,
      id_responsavel: responsavel?.id_responsavel ?? null,
      data,
      conteudo,
      origem,
      status_revisao: "pendente",
    }).select("id_diario").single()

    if (dErr) { toast.error("Erro ao criar diário: " + dErr.message); setIsSubmitting(false); return }

    const diarioId = (diario as { id_diario: number }).id_diario

    // Criar presenças em batch
    const presencas = escalados.map(e => ({
      id_diario: diarioId,
      id_trabalhador: e.id_trabalhador,
      id_contrato: e.id_contrato,
      tipo_presenca: e.tipo_presenca,
      valor_dia: calcValor(e),
      observacoes: e.observacoes || null,
    }))

    const { error: pErr } = await supabase.from("presenca").insert(presencas)
    if (pErr) { toast.error("Erro ao registrar presenças: " + pErr.message); setIsSubmitting(false); return }

    toast.success("Diário e presenças registrados")
    router.push(`/obras/${obraId}/diarios`)
  }

  const totalDia = escalados.reduce((s, e) => s + calcValor(e), 0)

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Novo diário de obra</h1>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Data</Label><Input type="date" value={data} onChange={(e) => setData(e.target.value)} /></div>
          <div>
            <Label>Origem</Label>
            <Select value={origem} onValueChange={(v) => v && setOrigem(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="plaud">Plaud</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Conteúdo do diário *</Label>
          <Textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={6} placeholder="Descreva as atividades realizadas, condições climáticas, ocorrências..." />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Presenças do dia</h2>
          <span className="text-sm font-mono font-semibold">Total: {formatBRL(totalDia)}</span>
        </div>

        {escalados.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum trabalhador escalado para {data}. Escale trabalhadores na aba Equipe.</p>
        ) : (
          <div className="space-y-2">
            {escalados.map((e, i) => (
              <div key={e.id_trabalhador} className="border rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1">
                  <p className="font-medium">{e.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.especialidade ? ESPECIALIDADE[e.especialidade as keyof typeof ESPECIALIDADE] ?? e.especialidade : ""} — {formatBRL(e.valor_acordado)}/dia
                  </p>
                </div>
                <Select value={e.tipo_presenca} onValueChange={(v) => v && updatePresenca(i, "tipo_presenca", v)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRESENCA_TIPO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="font-mono text-sm w-24 text-right">{formatBRL(calcValor(e))}</span>
                <Input className="w-40" placeholder="Obs..." value={e.observacoes} onChange={(ev) => updatePresenca(i, "observacoes", ev.target.value)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar diário e presenças
        </Button>
      </div>
    </div>
  )
}
