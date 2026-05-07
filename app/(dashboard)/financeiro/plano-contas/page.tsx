"use client"

// Port literal de granum-design/plano-contas-app.jsx + PlanoContas.html

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
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

interface PlanoNode {
  id: number
  nivel: number
  code: string
  nome: string
  tipo: "in" | "out" | "outro"
  realizado: number
  orcado: number
  children: number[]
  contas?: number
}

function fmtBRLk(v: number): string {
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000)
    return "R$ " + Math.round(v / 1000).toLocaleString("pt-BR") + " mil"
  return "R$ " + v
}

function fmtPct(v: number): string {
  return v.toFixed(0) + "%"
}

function PctBar({
  real,
  orc,
  tipo,
}: {
  real: number
  orc: number
  tipo: "in" | "out" | "outro"
}) {
  const pct = orc ? (real / orc) * 100 : 0
  const over = pct > 100
  let color = tipo === "in" ? "var(--success)" : "var(--info)"
  if (tipo === "out" && over) color = "var(--danger)"
  if (tipo === "out" && pct > 85 && pct <= 100) color = "var(--warning)"
  return (
    <div className="pct-bar">
      <div className="pct-bar-track">
        <div
          className="pct-bar-fill"
          style={{ width: Math.min(pct, 100) + "%", background: color }}
        />
        {over ? (
          <div className="pct-bar-over" style={{ left: "100%" }} />
        ) : null}
      </div>
      <div
        className="pct-bar-label mono"
        style={{ color: over ? "var(--danger)" : "var(--ink-muted)" }}
      >
        {fmtPct(pct)}
      </div>
    </div>
  )
}

function calcLevel(code: string | null): number {
  if (!code) return 1
  return code.split(".").length
}

export default function PlanoContasPage() {
  const [items, setItems] = useState<PlanoNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [fTipo, setFTipo] = useState<"todos" | "in" | "out">("todos")
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
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }

    const list = data ?? []
    const childrenMap = new Map<number, number[]>()
    for (const c of list) {
      if (c.id_pai) {
        const arr = childrenMap.get(c.id_pai) ?? []
        arr.push(c.id_plano)
        childrenMap.set(c.id_pai, arr)
      }
    }

    const nodes: PlanoNode[] = list.map((c) => ({
      id: c.id_plano,
      nivel: calcLevel(c.codigo),
      code: c.codigo ?? "",
      nome: c.nome,
      tipo:
        c.tipo_plano === "receita"
          ? "in"
          : c.tipo_plano === "despesa"
            ? "out"
            : "outro",
      realizado: 0,
      orcado: 0,
      children: childrenMap.get(c.id_plano) ?? [],
      contas: undefined,
    }))

    setItems(nodes)
    setExpanded(new Set(nodes.filter((n) => n.nivel <= 2).map((n) => n.id)))
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(() => {
    const byId = new Map(items.map((n) => [n.id, n]))
    const rootIds = items.filter((n) => n.nivel === 1).map((n) => n.id)
    const out: PlanoNode[] = []

    function nodeMatches(n: PlanoNode): boolean {
      if (
        busca &&
        !(
          n.nome.toLowerCase().includes(busca.toLowerCase()) ||
          n.code.includes(busca)
        )
      ) {
        return n.children.some((cid) => {
          const c = byId.get(cid)
          return c ? nodeMatches(c) : false
        })
      }
      return true
    }

    function walk(id: number) {
      const n = byId.get(id)
      if (!n) return
      if (fTipo !== "todos" && n.tipo !== fTipo) return
      if (!nodeMatches(n)) return
      out.push(n)
      if (expanded.has(id)) {
        n.children.forEach(walk)
      }
    }
    rootIds.forEach(walk)
    return out
  }, [items, expanded, fTipo, busca])

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  const totalContas = items.length
  const receitas = items.filter((n) => n.tipo === "in").length
  const despesas = items.filter((n) => n.tipo === "out").length

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
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Financeiro · Estrutura contábil</div>
            <h1>Plano de contas</h1>
            <div className="subtitle">
              {totalContas} categorias · {receitas} receitas · {despesas}{" "}
              despesas
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="download" />
              Exportar DRE
            </button>
            <button className="btn btn-secondary" type="button" disabled>
              <Icon name="edit" />
              Editar estrutura
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setFormOpen(true)}
            >
              <Icon name="plus" />
              Nova categoria
            </button>
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi">
          <div className="list-kpi-label">Categorias</div>
          <div className="list-kpi-value">{totalContas}</div>
          <div className="list-kpi-sub">
            <Icon name="layers" />
            Estrutura hierárquica
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Receitas</div>
          <div className="list-kpi-value fin-pos">{receitas}</div>
          <div className="list-kpi-sub">
            <Icon name="arrowDown" />
            Categorias de entrada
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Despesas</div>
          <div className="list-kpi-value fin-neg">{despesas}</div>
          <div className="list-kpi-sub">
            <Icon name="arrowUp" />
            Categorias de saída
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Analíticas</div>
          <div className="list-kpi-value">
            {items.filter((n) => n.children.length === 0).length}
          </div>
          <div className="list-kpi-sub">
            <Icon name="check" />
            Aceitam lançamento
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar categoria ou código…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Tudo" },
                  { id: "in", label: "Receitas" },
                  { id: "out", label: "Despesas" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"seg-btn" + (fTipo === t.id ? " active" : "")}
                  onClick={() => setFTipo(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setExpanded(new Set(items.map((n) => n.id)))}
            >
              Expandir tudo
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setExpanded(new Set())}
            >
              Recolher tudo
            </button>
          </div>
        </div>

        <div className="list-table list-table-plano">
          <div className="list-thead">
            <div>Código · Categoria</div>
            <div>Lançamentos</div>
            <div className="num">Realizado</div>
            <div className="num">Orçado</div>
            <div>Utilização</div>
            <div></div>
          </div>
          {isLoading ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--ink-muted)",
                fontSize: 13.5,
              }}
            >
              Carregando…
            </div>
          ) : visible.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--ink-muted)",
                fontSize: 13.5,
              }}
            >
              Plano vazio. Crie a primeira categoria.
            </div>
          ) : (
            visible.map((n) => {
              const hasChildren = n.children.length > 0
              const isExpanded = expanded.has(n.id)
              return (
                <div
                  className={
                    "list-row2 plano-row plano-lvl-" +
                    n.nivel +
                    (n.nivel === 1
                      ? n.tipo === "in"
                        ? " plano-root-in"
                        : " plano-root-out"
                      : "")
                  }
                  key={n.id}
                >
                  <div className="plano-name-cell">
                    <div
                      style={{
                        paddingLeft: (n.nivel - 1) * 24,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          className="tree-toggle"
                          onClick={() => toggle(n.id)}
                          aria-label={isExpanded ? "Recolher" : "Expandir"}
                        >
                          <Icon
                            name={isExpanded ? "chevronDown" : "chevronRight"}
                          />
                        </button>
                      ) : (
                        <span
                          style={{ width: 20, display: "inline-block" }}
                        />
                      )}
                      <span className="mono plano-code">{n.code}</span>
                      <span className={"plano-nome lvl-" + n.nivel}>
                        {n.nome}
                      </span>
                      {n.nivel === 1 ? (
                        <span
                          className={
                            "badge dot " +
                            (n.tipo === "in"
                              ? "badge-success"
                              : "badge-danger")
                          }
                          style={{ marginLeft: 8 }}
                        >
                          {n.tipo === "in" ? "Receita" : "Despesa"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    {n.contas != null ? (
                      <span className="mono sub">{n.contas} lançamentos</span>
                    ) : (
                      <span className="sub">— consolidado —</span>
                    )}
                  </div>
                  <div className="list-cell-num">
                    <div
                      className={
                        "val mono " +
                        (n.tipo === "in" ? "fin-pos" : "fin-neg")
                      }
                      style={{ fontSize: n.nivel === 1 ? 14 : 13 }}
                    >
                      {fmtBRLk(n.realizado)}
                    </div>
                  </div>
                  <div className="list-cell-num">
                    <div
                      className="mono"
                      style={{
                        fontSize: 13,
                        color: "var(--ink-muted)",
                      }}
                    >
                      {fmtBRLk(n.orcado)}
                    </div>
                  </div>
                  <div>
                    <PctBar real={n.realizado} orc={n.orcado} tipo={n.tipo} />
                  </div>
                  <div className="list-cell-actions">
                    <button type="button" className="icon-btn">
                      <Icon name="more" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
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
                  {items.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.code ? `${c.code} · ` : ""}
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
    </>
  )
}
