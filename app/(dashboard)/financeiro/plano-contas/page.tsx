"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Plus, ChevronRight, ChevronDown } from "lucide-react"

interface PlanoConta {
  id_plano: number; codigo: string | null; nome: string
  id_pai: number | null; tipo_plano: string | null; analitica: boolean
  children?: PlanoConta[]
}

function buildTree(items: PlanoConta[]): PlanoConta[] {
  const map = new Map<number, PlanoConta>()
  items.forEach(i => map.set(i.id_plano, { ...i, children: [] }))
  const roots: PlanoConta[] = []
  map.forEach(item => {
    if (item.id_pai && map.has(item.id_pai)) {
      map.get(item.id_pai)!.children!.push(item)
    } else {
      roots.push(item)
    }
  })
  return roots
}

function TreeNode({ node, level = 0 }: { node: PlanoConta; level?: number }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div className="flex items-center gap-1 py-1 hover:bg-gray-50 rounded" style={{ paddingLeft: `${level * 20 + 8}px` }}>
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="p-0.5">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : <span className="w-4" />}
        <span className="text-sm font-mono text-muted-foreground w-16">{node.codigo}</span>
        <span className={`text-sm ${node.analitica ? "" : "font-semibold"}`}>{node.nome}</span>
        {node.analitica && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-2">analítica</span>}
        {node.tipo_plano && <span className={`text-xs px-1.5 py-0.5 rounded ml-1 ${node.tipo_plano === "receita" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{node.tipo_plano}</span>}
      </div>
      {open && hasChildren && node.children!.map(child => (
        <TreeNode key={child.id_plano} node={child} level={level + 1} />
      ))}
    </div>
  )
}

export default function PlanoContasPage() {
  const [tree, setTree] = useState<PlanoConta[]>([])
  const [allContas, setAllContas] = useState<PlanoConta[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [codigo, setCodigo] = useState("")
  const [idPai, setIdPai] = useState<number | undefined>()
  const [tipoPlan, setTipoPlan] = useState("")
  const [analitica, setAnalitica] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("plano_conta").select("*").order("codigo")
    const items = (data ?? []) as PlanoConta[]
    setAllContas(items)
    setTree(buildTree(items))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!nome) { toast.error("Nome obrigatório"); return }
    const supabase = createClient()
    const { error } = await supabase.from("plano_conta").insert({
      nome, codigo: codigo || null, id_pai: idPai || null,
      tipo_plano: tipoPlan || null, analitica,
    })
    if (error) { toast.error("Erro: " + error.message); return }
    toast.success("Conta criada")
    setNome(""); setCodigo(""); setFormOpen(false); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plano de contas</h1>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova conta</Button>
      </div>

      <div className="border rounded p-4 bg-white">
        {tree.length === 0 ? <p className="text-muted-foreground text-sm">Nenhuma conta cadastrada.</p> :
          tree.map(node => <TreeNode key={node.id_plano} node={node} />)
        }
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova conta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Código</Label><Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: 2.1.8" /></div>
            <div><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div>
              <Label>Conta pai</Label>
              <Select value={idPai?.toString() || ""} onValueChange={(v) => v && setIdPai(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Raiz (nenhuma)" /></SelectTrigger>
                <SelectContent>{allContas.filter(c => !c.analitica).map((c) => <SelectItem key={c.id_plano} value={c.id_plano.toString()}>{c.codigo} - {c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipoPlan} onValueChange={(v) => v && setTipoPlan(v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={analitica} onCheckedChange={(v) => setAnalitica(!!v)} />
              <Label>Conta analítica (aceita lançamentos)</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
