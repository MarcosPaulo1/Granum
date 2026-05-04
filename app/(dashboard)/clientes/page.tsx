"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { ClienteForm } from "@/components/forms/cliente-form"
import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/shared/segmented-control"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatCPFCNPJ } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Cliente = Database["public"]["Tables"]["cliente"]["Row"]

interface ObraResumo {
  id: number
  nome: string
  status: string | null
}

interface ClienteRow extends Cliente {
  tipo: "PF" | "PJ"
  obras: ObraResumo[]
  totalObras: number
  obrasAtivas: number
}

const ACTIVE_OBRA_STATUSES = new Set(["em_andamento", "planejamento"])

function detectTipo(cpfCnpj: string | null): "PF" | "PJ" {
  if (!cpfCnpj) return "PF"
  const digits = cpfCnpj.replace(/\D/g, "")
  return digits.length >= 14 ? "PJ" : "PF"
}

function clienteCode(id: number) {
  return `CLI-${String(id).padStart(4, "0")}`
}

const TIPO_OPTIONS: SegmentedOption<"todos" | "PF" | "PJ">[] = [
  { value: "todos", label: "Todos" },
  { value: "PF", label: "PF" },
  { value: "PJ", label: "PJ" },
]

function ObraStatusDot({ status }: { status: string | null }) {
  const color =
    status === "em_andamento"
      ? "bg-[var(--info)]"
      : status === "planejamento"
        ? "bg-muted-foreground/60"
        : status === "pausada"
          ? "bg-[var(--warning)]"
          : status === "concluida"
            ? "bg-[var(--success)]"
            : status === "cancelada"
              ? "bg-destructive"
              : "bg-muted-foreground/60"
  return <span className={cn("inline-block size-1.5 shrink-0 rounded-full", color)} />
}

export default function ClientesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<ClienteRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] =
    useState<"todos" | "PF" | "PJ">("todos")
  const [filtroAtividade, setFiltroAtividade] =
    useState<"todos" | "ativos" | "sem_obra">("todos")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { data: clientes, error: clientesError } = await supabase
      .from("cliente")
      .select("*")
      .order("nome")

    if (clientesError) {
      toast.error("Erro ao carregar clientes: " + clientesError.message)
      setIsLoading(false)
      return
    }

    const ids = (clientes ?? []).map((c) => c.id_cliente)

    let obrasPorCliente = new Map<number, ObraResumo[]>()
    if (ids.length > 0) {
      const { data: obras, error: obrasError } = await supabase
        .from("obra")
        .select("id_obra, nome, status, id_cliente")
        .in("id_cliente", ids)

      if (obrasError) {
        toast.error("Erro ao carregar obras: " + obrasError.message)
      } else {
        for (const o of obras ?? []) {
          const arr = obrasPorCliente.get(o.id_cliente) ?? []
          arr.push({ id: o.id_obra, nome: o.nome, status: o.status })
          obrasPorCliente.set(o.id_cliente, arr)
        }
      }
    }

    const enriched: ClienteRow[] = (clientes ?? []).map((c) => {
      const obras = obrasPorCliente.get(c.id_cliente) ?? []
      const ativas = obras.filter((o) =>
        ACTIVE_OBRA_STATUSES.has(o.status ?? "")
      ).length
      return {
        ...c,
        tipo: detectTipo(c.cpf_cnpj),
        obras,
        totalObras: obras.length,
        obrasAtivas: ativas,
      }
    })

    setRows(enriched)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filtroTipo !== "todos" && r.tipo !== filtroTipo) return false
        if (filtroAtividade === "ativos" && r.obrasAtivas === 0) return false
        if (filtroAtividade === "sem_obra" && r.totalObras > 0) return false
        if (busca) {
          const q = busca.toLowerCase()
          const haystack = [r.nome, r.cpf_cnpj, r.email, r.telefone]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [rows, filtroTipo, filtroAtividade, busca]
  )

  const totalClientes = rows.length
  const comObrasAtivas = rows.filter((r) => r.obrasAtivas > 0).length
  const totalObrasAtivas = rows.reduce((a, r) => a + r.obrasAtivas, 0)
  const pfCount = rows.filter((r) => r.tipo === "PF").length
  const pjCount = rows.filter((r) => r.tipo === "PJ").length
  const semObra = rows.filter((r) => r.totalObras === 0).length

  const ATIVIDADE_OPTIONS: SegmentedOption<typeof filtroAtividade>[] = [
    { value: "todos", label: "Todos", count: totalClientes },
    { value: "ativos", label: "Com obra ativa", count: comObrasAtivas },
    { value: "sem_obra", label: "Sem obra", count: semObra },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastros"
        title="Clientes"
        subtitle={`${totalClientes} cliente${totalClientes === 1 ? "" : "s"} cadastrado${totalClientes === 1 ? "" : "s"} · ${comObrasAtivas} com obra ativa`}
        actions={
          <>
            <Button variant="ghost" size="sm" disabled>
              <Upload data-icon="inline-start" />
              Importar
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Download data-icon="inline-start" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus data-icon="inline-start" />
              Novo cliente
            </Button>
          </>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          label="Total de clientes"
          value={totalClientes}
          sub={`${pfCount} PF · ${pjCount} PJ`}
          icon={<Users />}
        />
        <KpiCard
          tone="info"
          label="Com obra ativa"
          value={comObrasAtivas}
          sub={`${totalObrasAtivas} obra${totalObrasAtivas === 1 ? "" : "s"} em execução`}
          icon={<Building />}
        />
        <KpiCard
          label="Pessoa física"
          value={pfCount}
          sub={`${totalClientes ? Math.round((pfCount * 100) / totalClientes) : 0}% do total`}
        />
        <KpiCard
          label="Pessoa jurídica"
          value={pjCount}
          sub={`${totalClientes ? Math.round((pjCount * 100) / totalClientes) : 0}% do total`}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, CNPJ/CPF, e-mail…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              value={filtroTipo}
              onValueChange={setFiltroTipo}
              options={TIPO_OPTIONS}
              ariaLabel="Filtro de tipo"
            />
            <SegmentedControl
              value={filtroAtividade}
              onValueChange={setFiltroAtividade}
              options={ATIVIDADE_OPTIONS}
              ariaLabel="Filtro de atividade"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-semibold">Cliente</th>
                <th className="px-5 py-2.5 text-left font-semibold">Documento</th>
                <th className="px-5 py-2.5 text-left font-semibold">Contato</th>
                <th className="px-5 py-2.5 text-left font-semibold">Obras</th>
                <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                <th className="w-12 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    Carregando clientes…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    {rows.length === 0
                      ? "Nenhum cliente cadastrado ainda."
                      : "Nenhum cliente encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id_cliente}
                    className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
                    onClick={() => router.push(`/clientes/${c.id_cliente}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          variant={c.tipo === "PJ" ? "pj" : "pf"}
                          name={c.nome}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-[13.5px] font-medium text-foreground">
                            {c.nome}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground tabular-nums">
                            {clienteCode(c.id_cliente)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <CategoryChip tone="neutral" className="mb-1">
                        {c.tipo}
                      </CategoryChip>
                      <div className="mono text-[12.5px] text-foreground tabular-nums">
                        {c.cpf_cnpj ? formatCPFCNPJ(c.cpf_cnpj) : "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-[12.5px] text-foreground">
                        {c.email ?? <span className="text-muted-foreground">—</span>}
                      </div>
                      {c.telefone ? (
                        <div className="mono mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
                          {c.telefone}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3">
                      {c.obras.length === 0 ? (
                        <span className="text-[12.5px] text-muted-foreground">
                          —
                        </span>
                      ) : (
                        <>
                          <div className="flex max-w-[280px] items-center gap-1.5 text-[13px] text-foreground">
                            <ObraStatusDot status={c.obras[0].status} />
                            <span className="truncate">{c.obras[0].nome}</span>
                          </div>
                          {c.totalObras > 1 ? (
                            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                              + {c.totalObras - 1} outra
                              {c.totalObras - 1 > 1 ? "s" : ""} ·{" "}
                              {c.obrasAtivas} ativa
                              {c.obrasAtivas !== 1 ? "s" : ""}
                            </div>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {c.obrasAtivas > 0 ? (
                        <CategoryChip tone="success">
                          <span className="size-1.5 rounded-full bg-[var(--success)]" />
                          Ativo
                        </CategoryChip>
                      ) : c.totalObras > 0 ? (
                        <CategoryChip tone="neutral">
                          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                          Sem obra ativa
                        </CategoryChip>
                      ) : (
                        <CategoryChip tone="warning">
                          <span className="size-1.5 rounded-full bg-[var(--warning)]" />
                          Prospecto
                        </CategoryChip>
                      )}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Mais ações"
                      >
                        <MoreHorizontal />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[12.5px] text-muted-foreground">
          <span>
            Mostrando {filtered.length} de {totalClientes} cliente
            {totalClientes !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <ClienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </div>
  )
}
