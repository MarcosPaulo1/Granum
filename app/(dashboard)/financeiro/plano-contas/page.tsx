"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  MoreHorizontal,
  Plus,
  Search,
  TreePine,
} from "lucide-react"
import { toast } from "sonner"

import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/shared/segmented-control"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface PlanoConta {
  id_plano: number
  codigo: string | null
  nome: string
  id_pai: number | null
  tipo_plano: string | null
  analitica: boolean
}

interface PlanoNode extends PlanoConta {
  children: PlanoNode[]
  nivel: number
  rootTipo: "receita" | "despesa" | null
}

function buildTree(items: PlanoConta[]): PlanoNode[] {
  const byId = new Map<number, PlanoNode>()
  for (const i of items) {
    byId.set(i.id_plano, { ...i, children: [], nivel: 1, rootTipo: null })
  }
  const roots: PlanoNode[] = []
  for (const node of byId.values()) {
    if (node.id_pai && byId.has(node.id_pai)) {
      byId.get(node.id_pai)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  // calcular nivel + rootTipo
  function walk(node: PlanoNode, nivel: number, rootTipo: "receita" | "despesa" | null) {
    node.nivel = nivel
    if (nivel === 1) {
      node.rootTipo =
        node.tipo_plano === "receita" || node.tipo_plano === "despesa"
          ? node.tipo_plano
          : null
    } else {
      node.rootTipo = rootTipo
    }
    for (const c of node.children) walk(c, nivel + 1, node.rootTipo)
  }
  for (const r of roots) walk(r, 1, null)
  // sort by codigo
  const sortFn = (a: PlanoNode, b: PlanoNode) =>
    (a.codigo ?? "").localeCompare(b.codigo ?? "", "pt-BR", { numeric: true })
  function sortRecursive(nodes: PlanoNode[]) {
    nodes.sort(sortFn)
    for (const n of nodes) sortRecursive(n.children)
  }
  sortRecursive(roots)
  return roots
}

function flatten(
  roots: PlanoNode[],
  expanded: Set<number>,
  filtroTipo: "todos" | "receita" | "despesa",
  busca: string
): PlanoNode[] {
  const out: PlanoNode[] = []
  function visit(node: PlanoNode) {
    if (
      filtroTipo !== "todos" &&
      node.rootTipo &&
      node.rootTipo !== filtroTipo
    )
      return
    if (
      busca &&
      !(
        node.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (node.codigo ?? "").toLowerCase().includes(busca.toLowerCase())
      )
    ) {
      // Mostra mesmo assim se algum filho bater
      const hits = node.children.some((c) =>
        matchesBusca(c, busca, filtroTipo)
      )
      if (!hits) return
    }
    out.push(node)
    if (expanded.has(node.id_plano) || busca) {
      for (const c of node.children) visit(c)
    }
  }
  for (const r of roots) visit(r)
  return out
}

function matchesBusca(
  node: PlanoNode,
  busca: string,
  filtroTipo: "todos" | "receita" | "despesa"
): boolean {
  if (filtroTipo !== "todos" && node.rootTipo && node.rootTipo !== filtroTipo)
    return false
  if (
    node.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (node.codigo ?? "").toLowerCase().includes(busca.toLowerCase())
  )
    return true
  return node.children.some((c) => matchesBusca(c, busca, filtroTipo))
}

const TIPO_OPTIONS: SegmentedOption<"todos" | "receita" | "despesa">[] = [
  { value: "todos", label: "Tudo" },
  { value: "receita", label: "Receitas" },
  { value: "despesa", label: "Despesas" },
]

export default function PlanoContasPage() {
  const [items, setItems] = useState<PlanoConta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [filtroTipo, setFiltroTipo] =
    useState<"todos" | "receita" | "despesa">("todos")
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [novaConta, setNovaConta] = useState({
    nome: "",
    codigo: "",
    id_pai: undefined as number | undefined,
    tipo_plano: "" as "" | "receita" | "despesa",
    analitica: false,
  })
  const [savingNova, setSavingNova] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("plano_conta")
      .select("*")
      .order("codigo")

    if (error) {
      toast.error("Erro ao carregar plano: " + error.message)
      setIsLoading(false)
      return
    }
    const list = (data ?? []).map((c) => ({
      ...c,
      analitica: c.analitica ?? false,
    })) as PlanoConta[]
    setItems(list)
    // Por padrão, expandir nivel 1
    const tree = buildTree(list)
    setExpanded(new Set(tree.map((r) => r.id_plano)))
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const tree = useMemo(() => buildTree(items), [items])
  const visible = useMemo(
    () => flatten(tree, expanded, filtroTipo, busca),
    [tree, expanded, filtroTipo, busca]
  )

  const totalContas = items.length
  const receitas = items.filter((i) => i.tipo_plano === "receita").length
  const despesas = items.filter((i) => i.tipo_plano === "despesa").length
  const analiticas = items.filter((i) => i.analitica).length
  const niveis = useMemo(() => {
    let max = 1
    function walk(nodes: PlanoNode[], n: number) {
      for (const x of nodes) {
        if (n > max) max = n
        walk(x.children, n + 1)
      }
    }
    walk(tree, 1)
    return max
  }, [tree])

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function expandAll() {
    setExpanded(new Set(items.map((i) => i.id_plano)))
  }
  function collapseAll() {
    setExpanded(new Set())
  }

  async function handleAdd() {
    if (!novaConta.nome.trim()) {
      toast.error("Nome obrigatório")
      return
    }
    setSavingNova(true)
    const supabase = createClient()
    const { error } = await supabase.from("plano_conta").insert({
      nome: novaConta.nome.trim(),
      codigo: novaConta.codigo.trim() || null,
      id_pai: novaConta.id_pai ?? null,
      tipo_plano: novaConta.tipo_plano || null,
      analitica: novaConta.analitica,
    })
    setSavingNova(false)
    if (error) {
      toast.error("Erro: " + error.message)
      return
    }
    toast.success("Conta criada")
    setNovaConta({
      nome: "",
      codigo: "",
      id_pai: undefined,
      tipo_plano: "",
      analitica: false,
    })
    setFormOpen(false)
    load()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financeiro · Estrutura contábil"
        title="Plano de contas"
        subtitle={`${totalContas} categoria${totalContas === 1 ? "" : "s"} em ${niveis} níve${niveis === 1 ? "l" : "is"} · ${analiticas} analítica${analiticas === 1 ? "" : "s"} (aceitam lançamento)`}
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus data-icon="inline-start" />
            Nova categoria
          </Button>
        }
      />

      <KpiGrid cols={4}>
        <KpiCard
          label="Total de categorias"
          value={totalContas}
          sub={`${niveis} níve${niveis === 1 ? "l" : "is"} hierárquico${niveis === 1 ? "" : "s"}`}
          icon={<TreePine />}
        />
        <KpiCard
          tone="success"
          label="Receitas"
          value={receitas}
          sub={`${totalContas ? Math.round((receitas * 100) / totalContas) : 0}% do plano`}
          icon={<ArrowDown />}
        />
        <KpiCard
          tone="danger"
          label="Despesas"
          value={despesas}
          sub={`${totalContas ? Math.round((despesas * 100) / totalContas) : 0}% do plano`}
          icon={<ArrowUp />}
        />
        <KpiCard
          tone="info"
          label="Analíticas"
          value={analiticas}
          sub="Aceitam lançamento direto"
          icon={<FileText />}
        />
      </KpiGrid>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar categoria ou código…"
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
              ariaLabel="Tipo"
            />
            <Button variant="ghost" size="sm" onClick={expandAll}>
              <Layers data-icon="inline-start" />
              Expandir tudo
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Recolher tudo
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-semibold">
                  Código · Categoria
                </th>
                <th className="px-5 py-2.5 text-left font-semibold">Tipo</th>
                <th className="px-5 py-2.5 text-left font-semibold">Modo</th>
                <th className="w-12 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    Carregando plano…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-16 text-center text-sm text-muted-foreground"
                  >
                    {items.length === 0
                      ? "Plano de contas vazio. Comece criando uma categoria raiz."
                      : "Nenhuma categoria encontrada com esses filtros."}
                  </td>
                </tr>
              ) : (
                visible.map((n) => {
                  const hasChildren = n.children.length > 0
                  const isExpanded = expanded.has(n.id_plano)
                  return (
                    <tr
                      key={n.id_plano}
                      className={cn(
                        "border-b border-border transition-colors last:border-b-0 hover:bg-muted/30",
                        n.nivel === 1 && "bg-muted/30 font-medium"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${(n.nivel - 1) * 24}px` }}
                        >
                          {hasChildren ? (
                            <button
                              onClick={() => toggle(n.id_plano)}
                              className="-ml-1 flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label={isExpanded ? "Recolher" : "Expandir"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="inline-block w-5" />
                          )}
                          <span className="mono w-16 shrink-0 text-[12px] font-medium text-muted-foreground tabular-nums">
                            {n.codigo ?? "—"}
                          </span>
                          <span
                            className={cn(
                              "text-[13.5px]",
                              n.nivel === 1
                                ? "font-semibold text-foreground"
                                : "font-normal text-foreground"
                            )}
                          >
                            {n.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {n.tipo_plano === "receita" ? (
                          <CategoryChip tone="success">
                            <ArrowDown className="size-3" />
                            Receita
                          </CategoryChip>
                        ) : n.tipo_plano === "despesa" ? (
                          <CategoryChip tone="danger">
                            <ArrowUp className="size-3" />
                            Despesa
                          </CategoryChip>
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {n.analitica ? (
                          <CategoryChip tone="info">Analítica</CategoryChip>
                        ) : (
                          <CategoryChip tone="neutral">Sintética</CategoryChip>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
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
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código</Label>
              <Input
                value={novaConta.codigo}
                onChange={(e) =>
                  setNovaConta({ ...novaConta, codigo: e.target.value })
                }
                placeholder="Ex: 2.1.8"
              />
            </div>
            <div>
              <Label>Nome *</Label>
              <Input
                value={novaConta.nome}
                onChange={(e) =>
                  setNovaConta({ ...novaConta, nome: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Conta pai</Label>
              <Select
                value={novaConta.id_pai?.toString() ?? ""}
                onValueChange={(v) =>
                  setNovaConta({
                    ...novaConta,
                    id_pai: v ? Number(v) : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Raiz (nenhuma)" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter((c) => !c.analitica)
                    .map((c) => (
                      <SelectItem
                        key={c.id_plano}
                        value={c.id_plano.toString()}
                      >
                        {c.codigo ? `${c.codigo} · ` : ""}
                        {c.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                value={novaConta.tipo_plano}
                onValueChange={(v) =>
                  setNovaConta({
                    ...novaConta,
                    tipo_plano: v as "receita" | "despesa",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={novaConta.analitica}
                onCheckedChange={(v) =>
                  setNovaConta({ ...novaConta, analitica: !!v })
                }
              />
              <Label>Conta analítica (aceita lançamentos)</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={savingNova}
              >
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={savingNova}>
                {savingNova ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
