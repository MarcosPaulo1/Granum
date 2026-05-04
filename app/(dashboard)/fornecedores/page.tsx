"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Truck,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { FornecedorForm } from "@/components/forms/fornecedor-form"
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
import { formatCNPJ } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Fornecedor = Database["public"]["Tables"]["fornecedor"]["Row"]

type TipoChave = "material" | "servico" | "locacao" | "outro"

const TIPO_META: Record<
  TipoChave,
  { label: string; tone: "info" | "primary" | "warning" | "neutral" }
> = {
  material: { label: "Material", tone: "info" },
  servico: { label: "Serviço", tone: "primary" },
  locacao: { label: "Locação", tone: "warning" },
  outro: { label: "Outro", tone: "neutral" },
}

function normalizeTipo(tipo: string | null): TipoChave {
  if (!tipo) return "outro"
  const normalized = tipo.toLowerCase().replace(/[ç]/g, "c").trim()
  if (normalized.startsWith("mat")) return "material"
  if (normalized.startsWith("serv")) return "servico"
  if (normalized.startsWith("loc")) return "locacao"
  return "outro"
}

function fornecedorCode(id: number) {
  return `FOR-${String(id).padStart(4, "0")}`
}

const TIPO_OPTIONS: SegmentedOption<"todos" | TipoChave>[] = [
  { value: "todos", label: "Todos" },
  { value: "material", label: "Material" },
  { value: "servico", label: "Serviço" },
  { value: "locacao", label: "Locação" },
]

const STATUS_OPTIONS: SegmentedOption<"todos" | "ativos" | "inativos">[] = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
]

export default function FornecedoresPage() {
  const router = useRouter()
  const [data, setData] = useState<Fornecedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] =
    useState<"todos" | TipoChave>("todos")
  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | "ativos" | "inativos">("todos")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("fornecedor")
      .select("*")
      .order("nome")

    if (error) {
      toast.error("Erro ao carregar fornecedores: " + error.message)
      setIsLoading(false)
      return
    }
    setData(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      data.filter((f) => {
        const tipo = normalizeTipo(f.tipo)
        if (filtroTipo !== "todos" && tipo !== filtroTipo) return false
        if (filtroStatus === "ativos" && f.ativo === false) return false
        if (filtroStatus === "inativos" && f.ativo !== false) return false
        if (busca) {
          const q = busca.toLowerCase()
          const haystack = [f.nome, f.cnpj, f.email, f.contato]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      }),
    [data, filtroTipo, filtroStatus, busca]
  )

  const total = data.length
  const ativos = data.filter((f) => f.ativo !== false).length
  const inativos = total - ativos
  const matCount = data.filter((f) => normalizeTipo(f.tipo) === "material").length
  const servCount = data.filter((f) => normalizeTipo(f.tipo) === "servico").length
  const locCount = data.filter((f) => normalizeTipo(f.tipo) === "locacao").length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastros"
        title="Fornecedores"
        subtitle={`${total} fornecedor${total === 1 ? "" : "es"} cadastrado${total === 1 ? "" : "s"} · ${ativos} ativo${ativos === 1 ? "" : "s"}`}
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
              Novo fornecedor
            </Button>
          </>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          label="Total de fornecedores"
          value={total}
          sub={`${ativos} ativos · ${inativos} inativos`}
          icon={<Truck />}
        />
        <KpiCard
          tone="info"
          label="Material"
          value={matCount}
          sub={`${total ? Math.round((matCount * 100) / total) : 0}% do total`}
        />
        <KpiCard
          tone="primary"
          label="Serviço"
          value={servCount}
          sub={`${total ? Math.round((servCount * 100) / total) : 0}% do total`}
        />
        <KpiCard
          tone="warning"
          label="Locação"
          value={locCount}
          sub={`${total ? Math.round((locCount * 100) / total) : 0}% do total`}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, CNPJ ou e-mail…"
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
              value={filtroStatus}
              onValueChange={setFiltroStatus}
              options={STATUS_OPTIONS}
              ariaLabel="Filtro de status"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-semibold">Fornecedor</th>
                <th className="px-5 py-2.5 text-left font-semibold">CNPJ</th>
                <th className="px-5 py-2.5 text-left font-semibold">Contato</th>
                <th className="px-5 py-2.5 text-left font-semibold">Tipo</th>
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
                    Carregando fornecedores…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    {data.length === 0
                      ? "Nenhum fornecedor cadastrado ainda."
                      : "Nenhum fornecedor encontrado com esses filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const tipo = normalizeTipo(f.tipo)
                  const tipoMeta = TIPO_META[tipo]
                  const ativo = f.ativo !== false
                  return (
                    <tr
                      key={f.id_fornecedor}
                      className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
                      onClick={() =>
                        router.push(`/fornecedores/${f.id_fornecedor}`)
                      }
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar variant="pj" name={f.nome} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-medium text-foreground">
                              {f.nome}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground tabular-nums">
                              {fornecedorCode(f.id_fornecedor)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <CategoryChip tone="neutral" className="mb-1">
                          CNPJ
                        </CategoryChip>
                        <div className="mono text-[12.5px] text-foreground tabular-nums">
                          {f.cnpj ? formatCNPJ(f.cnpj) : "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-[13px] text-foreground">
                          {f.contato ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        {f.email ? (
                          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                            {f.email}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <CategoryChip tone={tipoMeta.tone}>
                          {tipoMeta.label}
                        </CategoryChip>
                      </td>
                      <td className="px-5 py-3">
                        {ativo ? (
                          <CategoryChip tone="success">
                            <span className="size-1.5 rounded-full bg-[var(--success)]" />
                            Ativo
                          </CategoryChip>
                        ) : (
                          <CategoryChip tone="neutral">
                            <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                            Inativo
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[12.5px] text-muted-foreground">
          <span>
            Mostrando {filtered.length} de {total} fornecedor
            {total !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      <FornecedorForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </div>
  )
}
