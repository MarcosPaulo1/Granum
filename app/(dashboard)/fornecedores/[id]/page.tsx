"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Building,
  DollarSign,
  Mail,
  Pencil,
  Receipt,
  User,
} from "lucide-react"

import { FornecedorForm } from "@/components/forms/fornecedor-form"
import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL, formatCNPJ, formatDate } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Fornecedor = Database["public"]["Tables"]["fornecedor"]["Row"]

interface LancamentoResumido {
  id_lancamento: number
  data_competencia: string
  historico: string | null
  valor: number
  id_obra: number
  obra_nome: string
}

function fornecedorCode(id: number) {
  return `FOR-${String(id).padStart(4, "0")}`
}

const TIPO_TONE: Record<
  string,
  "primary" | "info" | "warning" | "neutral"
> = {
  material: "info",
  servico: "primary",
  locacao: "warning",
}

function normalizeTipo(t: string | null): string {
  if (!t) return "outro"
  const n = t.toLowerCase().replace(/[ç]/g, "c").trim()
  if (n.startsWith("mat")) return "material"
  if (n.startsWith("serv")) return "servico"
  if (n.startsWith("loc")) return "locacao"
  return "outro"
}

export default function FornecedorPerfilPage() {
  const params = useParams()
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null)
  const [lancamentos, setLancamentos] = useState<LancamentoResumido[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)
    const { data: f } = await supabase
      .from("fornecedor")
      .select("*")
      .eq("id_fornecedor", id)
      .single()
    setFornecedor(f)

    const { data: lancs } = await supabase
      .from("lancamento")
      .select("id_lancamento, data_competencia, historico, valor, id_obra")
      .eq("id_fornecedor", id)
      .eq("tipo", "realizado")
      .order("data_competencia", { ascending: false })

    const lancsList = (lancs ?? []) as (LancamentoResumido & {
      id_obra: number
    })[]
    const obraIds = Array.from(new Set(lancsList.map((l) => l.id_obra)))
    const { data: obras } = obraIds.length
      ? await supabase
          .from("obra")
          .select("id_obra, nome")
          .in("id_obra", obraIds)
      : { data: [] as { id_obra: number; nome: string }[] }
    const obraMap = new Map(
      (obras ?? []).map((o) => [o.id_obra, o.nome as string])
    )

    setLancamentos(
      lancsList.map((l) => ({ ...l, obra_nome: obraMap.get(l.id_obra) ?? "" }))
    )
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!fornecedor) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Carregando fornecedor…
      </div>
    )
  }

  const totalPago = lancamentos.reduce((s, l) => s + Number(l.valor), 0)
  const obrasUnicas = new Set(lancamentos.map((l) => l.id_obra)).size
  const tipo = normalizeTipo(fornecedor.tipo)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link
          href="/fornecedores"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Fornecedores
        </Link>
        <span>·</span>
        <span className="mono tabular-nums">
          {fornecedorCode(fornecedor.id_fornecedor)}
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar variant="pj" name={fornecedor.nome} size="xl" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CategoryChip tone={TIPO_TONE[tipo] ?? "neutral"}>
                    {tipo === "material"
                      ? "Material"
                      : tipo === "servico"
                        ? "Serviço"
                        : tipo === "locacao"
                          ? "Locação"
                          : "Outro"}
                  </CategoryChip>
                  {fornecedor.ativo === false ? (
                    <CategoryChip tone="neutral">Inativo</CategoryChip>
                  ) : (
                    <CategoryChip tone="success">Ativo</CategoryChip>
                  )}
                </div>
                <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
                  {fornecedor.nome}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                  {fornecedor.cnpj ? (
                    <span className="mono tabular-nums">
                      {formatCNPJ(fornecedor.cnpj)}
                    </span>
                  ) : null}
                  {fornecedor.contato ? (
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3.5" />
                      {fornecedor.contato}
                    </span>
                  ) : null}
                  {fornecedor.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5" />
                      {fornecedor.email}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormOpen(true)}
            >
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      <KpiGrid cols={4}>
        <KpiCard
          tone="success"
          label="Total pago"
          value={formatBRL(totalPago)}
          sub="Histórico realizado"
          icon={<DollarSign />}
        />
        <KpiCard
          label="Lançamentos"
          value={lancamentos.length}
          sub="Pagamentos registrados"
          icon={<Receipt />}
        />
        <KpiCard
          tone="info"
          label="Obras atendidas"
          value={obrasUnicas}
          sub={
            obrasUnicas === 0 ? "Nenhuma obra ainda" : "Obras com pagamento"
          }
          icon={<Building />}
        />
        <KpiCard
          label="Ticket médio"
          value={
            lancamentos.length > 0
              ? formatBRL(Math.round(totalPago / lancamentos.length))
              : formatBRL(0)
          }
          sub="Por lançamento"
        />
      </KpiGrid>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-foreground">
              Histórico de lançamentos
            </h3>
            <span className="text-[12px] text-muted-foreground">
              {lancamentos.length} entrada{lancamentos.length === 1 ? "" : "s"}
            </span>
          </div>
          {lancamentos.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Nenhum lançamento vinculado a este fornecedor.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {lancamentos.map((l) => (
                <div
                  key={l.id_lancamento}
                  className={cn(
                    "flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-muted/30"
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-foreground">
                      {l.historico ?? "(sem descrição)"}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
                      {formatDate(l.data_competencia)}
                      {l.obra_nome ? ` · ${l.obra_nome}` : ""}
                    </div>
                  </div>
                  <div className="mono shrink-0 text-[14px] font-semibold tabular-nums text-[var(--danger-ink)]">
                    {formatBRL(Number(l.valor))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FornecedorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        fornecedor={fornecedor}
        onSuccess={load}
      />
    </div>
  )
}
