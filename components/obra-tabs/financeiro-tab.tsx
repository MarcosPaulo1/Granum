"use client"

import { useCallback, useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { ArrowDown, ArrowUp, Plus } from "lucide-react"
import { toast } from "sonner"

import { LancamentoForm } from "@/components/forms/lancamento-form"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatBRL } from "@/lib/utils/format"

interface LancRow {
  id_lancamento: number
  data_competencia: string
  data_pagamento: string | null
  historico: string | null
  valor: number
  tipo: string
  entrada_saida: string
  fornecedor_nome: string
  centro_custo_nome: string
}

interface FinanceiroTabProps {
  obraId: number
}

export function FinanceiroTab({ obraId }: FinanceiroTabProps) {
  const [data, setData] = useState<LancRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: lancs, error } = await supabase
      .from("lancamento")
      .select("*")
      .eq("id_obra", obraId)
      .order("data_competencia", { ascending: false })

    if (error) {
      toast.error("Erro ao carregar lançamentos: " + error.message)
      setIsLoading(false)
      return
    }

    const list = (lancs ?? []) as (LancRow & {
      id_fornecedor: number | null
      id_centro_custo: number
    })[]
    const fornIds = Array.from(
      new Set(list.filter((l) => l.id_fornecedor).map((l) => l.id_fornecedor!))
    )
    const ccIds = Array.from(new Set(list.map((l) => l.id_centro_custo)))

    const [fornsRes, ccsRes] = await Promise.all([
      fornIds.length
        ? supabase
            .from("fornecedor")
            .select("id_fornecedor, nome")
            .in("id_fornecedor", fornIds)
        : Promise.resolve({
            data: [] as { id_fornecedor: number; nome: string }[],
          }),
      ccIds.length
        ? supabase
            .from("centro_custo")
            .select("id_centro_custo, nome")
            .in("id_centro_custo", ccIds)
        : Promise.resolve({
            data: [] as { id_centro_custo: number; nome: string }[],
          }),
    ])

    const fornMap = new Map(
      (fornsRes.data ?? []).map((f) => [f.id_fornecedor, f.nome])
    )
    const ccMap = new Map(
      (ccsRes.data ?? []).map((c) => [c.id_centro_custo, c.nome])
    )

    setData(
      list.map((l) => ({
        ...l,
        fornecedor_nome: l.id_fornecedor
          ? fornMap.get(l.id_fornecedor) ?? ""
          : "",
        centro_custo_nome: ccMap.get(l.id_centro_custo) ?? "",
      }))
    )
    setIsLoading(false)
  }, [obraId])

  useEffect(() => {
    load()
  }, [load])

  const totalEntradas = data
    .filter((l) => l.entrada_saida === "entrada")
    .reduce((s, l) => s + Number(l.valor), 0)
  const totalSaidas = data
    .filter((l) => l.entrada_saida === "saida")
    .reduce((s, l) => s + Number(l.valor), 0)
  const saldo = totalEntradas - totalSaidas

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">
              Lançamentos da obra
            </h3>
            <p className="text-[12px] text-muted-foreground">
              {data.length} lançamento{data.length === 1 ? "" : "s"} na obra
            </p>
          </div>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus data-icon="inline-start" />
            Novo lançamento
          </Button>
        </CardContent>
      </Card>

      <KpiGrid cols={3}>
        <KpiCard
          tone="success"
          label="Entradas"
          value={formatBRL(totalEntradas)}
          sub={`${data.filter((l) => l.entrada_saida === "entrada").length} entrada${data.filter((l) => l.entrada_saida === "entrada").length === 1 ? "" : "s"}`}
          icon={<ArrowDown />}
        />
        <KpiCard
          tone="danger"
          label="Saídas"
          value={formatBRL(totalSaidas)}
          sub={`${data.filter((l) => l.entrada_saida === "saida").length} saída${data.filter((l) => l.entrada_saida === "saida").length === 1 ? "" : "s"}`}
          icon={<ArrowUp />}
        />
        <KpiCard
          tone={saldo >= 0 ? "success" : "danger"}
          label="Saldo"
          value={formatBRL(saldo)}
          sub={saldo >= 0 ? "Positivo" : "Negativo"}
        />
      </KpiGrid>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              Carregando lançamentos…
            </div>
          ) : data.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              Nenhum lançamento nesta obra ainda.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.map((l) => {
                const isEntrada = l.entrada_saida === "entrada"
                const isPago = !!l.data_pagamento
                return (
                  <div
                    key={l.id_lancamento}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex size-7 shrink-0 items-center justify-center rounded-full",
                          isEntrada
                            ? "bg-[var(--success-soft)] text-[var(--success-ink)]"
                            : "bg-[var(--danger-soft)] text-[var(--danger-ink)]"
                        )}
                      >
                        {isEntrada ? (
                          <ArrowDown className="size-3.5" />
                        ) : (
                          <ArrowUp className="size-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground">
                          {l.historico ?? "(sem descrição)"}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                          <span className="tabular-nums">
                            {format(parseISO(l.data_competencia), "dd/MM/yyyy")}
                          </span>
                          {l.fornecedor_nome ? (
                            <>
                              <span>·</span>
                              <span className="truncate">
                                {l.fornecedor_nome}
                              </span>
                            </>
                          ) : null}
                          {l.centro_custo_nome ? (
                            <CategoryChip tone="neutral">
                              {l.centro_custo_nome}
                            </CategoryChip>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {isPago ? (
                        <CategoryChip tone="success">Pago</CategoryChip>
                      ) : null}
                      <span
                        className={cn(
                          "mono text-[14px] font-semibold tabular-nums",
                          isEntrada
                            ? "text-[var(--success-ink)]"
                            : "text-[var(--danger-ink)]"
                        )}
                      >
                        {isEntrada ? "+ " : "− "}
                        {formatBRL(Number(l.valor))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LancamentoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </div>
  )
}
