"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  HardHat,
  Hash,
  Pencil,
  Phone,
} from "lucide-react"

import { TrabalhadorForm } from "@/components/forms/trabalhador-form"
import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CONTRATO_STATUS,
  ESPECIALIDADE,
  TIPO_PAGAMENTO,
  TIPO_VINCULO,
} from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL, formatCPF, formatDate } from "@/lib/utils/format"

interface Trabalhador {
  id_trabalhador: number
  nome: string
  cpf: string | null
  telefone: string | null
  especialidade: string | null
  tipo_vinculo: string | null
  pix_chave: string | null
  observacoes: string | null
  ativo: boolean | null
}

interface Contrato {
  id_contrato: number
  id_obra: number
  tipo_pagamento: string
  valor_acordado: number
  data_inicio: string
  data_fim: string | null
  status: string | null
  obra_nome: string
}

const VINC_TONE: Record<
  string,
  "primary" | "info" | "success" | "warning" | "neutral"
> = {
  autonomo: "info",
  clt: "success",
  pj: "primary",
  empreiteiro: "warning",
}

function trabalhadorCode(id: number) {
  return `TRB-${String(id).padStart(4, "0")}`
}

function vincLabel(v: string | null) {
  if (!v) return "—"
  return (TIPO_VINCULO as Record<string, string>)[v] ?? v
}

function espLabel(e: string | null) {
  if (!e) return "—"
  return (ESPECIALIDADE as Record<string, string>)[e] ?? e
}

export default function TrabalhadorPerfilPage() {
  const params = useParams()
  const router = useRouter()
  const [trab, setTrab] = useState<Trabalhador | null>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: t } = await supabase
      .from("trabalhador")
      .select("*")
      .eq("id_trabalhador", id)
      .single()
    setTrab(t as Trabalhador | null)

    const { data: cts } = await supabase
      .from("contrato_trabalho")
      .select("*")
      .eq("id_trabalhador", id)
      .order("data_inicio", { ascending: false })

    const list = (cts ?? []) as (Contrato & { id_obra: number })[]
    const obraIds = Array.from(new Set(list.map((c) => c.id_obra)))
    if (obraIds.length > 0) {
      const { data: obras } = await supabase
        .from("obra")
        .select("id_obra, nome")
        .in("id_obra", obraIds)
      const obraMap = new Map(
        (obras ?? []).map((o) => [o.id_obra, o.nome as string])
      )
      setContratos(
        list.map((c) => ({ ...c, obra_nome: obraMap.get(c.id_obra) ?? "" }))
      )
    } else {
      setContratos([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!trab) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Carregando trabalhador…
      </div>
    )
  }

  const ativos = contratos.filter((c) => c.status === "ativo").length
  const obrasUnicas = new Set(contratos.map((c) => c.id_obra)).size
  const ultimoContrato = contratos[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link
          href="/trabalhadores"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Trabalhadores
        </Link>
        <span>·</span>
        <span className="mono tabular-nums">
          {trabalhadorCode(trab.id_trabalhador)}
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar variant="pf" name={trab.nome} size="xl" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {trab.tipo_vinculo ? (
                    <CategoryChip
                      tone={VINC_TONE[trab.tipo_vinculo] ?? "neutral"}
                    >
                      {vincLabel(trab.tipo_vinculo)}
                    </CategoryChip>
                  ) : null}
                  {trab.ativo === false ? (
                    <CategoryChip tone="neutral">Inativo</CategoryChip>
                  ) : (
                    <CategoryChip tone="success">Ativo</CategoryChip>
                  )}
                </div>
                <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
                  {trab.nome}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                  {trab.especialidade ? (
                    <span className="inline-flex items-center gap-1">
                      <HardHat className="size-3.5" />
                      {espLabel(trab.especialidade)}
                    </span>
                  ) : null}
                  {trab.cpf ? (
                    <span className="mono tabular-nums">
                      {formatCPF(trab.cpf)}
                    </span>
                  ) : null}
                  {trab.telefone ? (
                    <span className="mono inline-flex items-center gap-1 tabular-nums">
                      <Phone className="size-3.5" />
                      {trab.telefone}
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
          label="Total de contratos"
          value={contratos.length}
          sub={`${ativos} ativo${ativos === 1 ? "" : "s"}`}
          icon={<Hash />}
        />
        <KpiCard
          tone="info"
          label="Obras"
          value={obrasUnicas}
          sub={`${obrasUnicas === 0 ? "Nunca" : "Já atuou"} em obras`}
          icon={<HardHat />}
        />
        <KpiCard
          label="Último valor"
          value={
            ultimoContrato
              ? formatBRL(ultimoContrato.valor_acordado)
              : formatBRL(0)
          }
          sub={
            ultimoContrato
              ? (TIPO_PAGAMENTO as Record<string, string>)[
                  ultimoContrato.tipo_pagamento
                ] ?? ultimoContrato.tipo_pagamento
              : "Sem contrato"
          }
        />
        <KpiCard
          tone="primary"
          label="PIX"
          value={
            <span className="text-[14px] font-normal break-all">
              {trab.pix_chave ?? "—"}
            </span>
          }
          sub="Chave de pagamento"
          icon={<CreditCard />}
        />
      </KpiGrid>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-foreground">
              Histórico de contratos
            </h3>
            <span className="text-[12px] text-muted-foreground">
              {contratos.length} contrato{contratos.length === 1 ? "" : "s"}
            </span>
          </div>
          {contratos.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Nenhum contrato registrado.
            </p>
          ) : (
            <div className="space-y-1.5">
              {contratos.map((c) => (
                <button
                  key={c.id_contrato}
                  onClick={() => router.push(`/obras/${c.id_obra}`)}
                  className="flex w-full items-center justify-between gap-4 rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium text-foreground">
                      {c.obra_nome || "Obra não encontrada"}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formatDate(c.data_inicio)}
                        {c.data_fim ? ` → ${formatDate(c.data_fim)}` : ""}
                      </span>
                      <span>·</span>
                      <span>
                        {(TIPO_PAGAMENTO as Record<string, string>)[
                          c.tipo_pagamento
                        ] ?? c.tipo_pagamento}
                      </span>
                      <span className="mono tabular-nums">
                        {formatBRL(c.valor_acordado)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge
                    status={c.status ?? "ativo"}
                    statusMap={CONTRATO_STATUS}
                  />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TrabalhadorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        trabalhador={trab as unknown as Record<string, unknown>}
        onSuccess={load}
      />
    </div>
  )
}
