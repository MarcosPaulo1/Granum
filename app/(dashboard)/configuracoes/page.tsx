"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <Tabs defaultValue="perfis">
        <TabsList>
          <TabsTrigger value="perfis">Perfis de acesso</TabsTrigger>
          <TabsTrigger value="etapas">Etapas padrão</TabsTrigger>
          <TabsTrigger value="grupos">Grupos de movimento</TabsTrigger>
          <TabsTrigger value="centros">Centros de custo</TabsTrigger>
        </TabsList>
        <TabsContent value="perfis"><CrudTab table="perfil" fields={["nome", "descricao"]} idField="id_perfil" labelField="nome" /></TabsContent>
        <TabsContent value="etapas"><CrudTab table="etapa" fields={["codigo", "nome", "descricao", "ordem"]} idField="id_etapa" labelField="nome" /></TabsContent>
        <TabsContent value="grupos"><CrudTab table="grupo_movimento" fields={["nome", "descricao"]} idField="id_grupo" labelField="nome" /></TabsContent>
        <TabsContent value="centros"><CrudTab table="centro_custo" fields={["codigo", "nome", "descricao"]} idField="id_centro_custo" labelField="nome" /></TabsContent>
      </Tabs>
    </div>
  )
}

function CrudTab({ table, fields, idField, labelField }: { table: string; fields: string[]; idField: string; labelField: string }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from(table).select("*").order(labelField)
    setItems((data ?? []) as Record<string, unknown>[])
  }, [table, labelField])

  useEffect(() => { load() }, [load])

  function startEdit(item: Record<string, unknown> | null) {
    setEditing(item)
    if (item) {
      const fd: Record<string, string> = {}
      fields.forEach(f => fd[f] = String(item[f] ?? ""))
      setFormData(fd)
    } else {
      setFormData(Object.fromEntries(fields.map(f => [f, ""])))
    }
  }

  async function save() {
    const supabase = createClient()
    const payload: Record<string, unknown> = {}
    fields.forEach(f => {
      if (f === "ordem") payload[f] = Number(formData[f]) || 0
      else payload[f] = formData[f] || null
    })

    if (editing) {
      const { error } = await supabase.from(table).update(payload).eq(idField, editing[idField] as number)
      if (error) { toast.error("Erro: " + error.message); return }
      toast.success("Atualizado")
    } else {
      const { error } = await supabase.from(table).insert(payload)
      if (error) { toast.error("Erro: " + error.message); return }
      toast.success("Criado")
    }
    setEditing(null); setFormData({}); load()
  }

  return (
    <div className="mt-4 space-y-4">
      <Button size="sm" onClick={() => startEdit(null)}><Plus className="mr-2 h-4 w-4" /> Novo</Button>

      {(editing !== undefined && Object.keys(formData).length > 0) && (
        <div className="border rounded p-4 space-y-3">
          {fields.map(f => (
            <div key={f}>
              <Label className="capitalize">{f.replace("_", " ")}</Label>
              {f === "descricao" ? (
                <Textarea value={formData[f] ?? ""} onChange={(e) => setFormData(p => ({ ...p, [f]: e.target.value }))} />
              ) : (
                <Input value={formData[f] ?? ""} onChange={(e) => setFormData(p => ({ ...p, [f]: e.target.value }))} type={f === "ordem" ? "number" : "text"} />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setFormData({}) }}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item[idField] as number} className="flex items-center justify-between border rounded p-2">
            <div>
              <span className="font-medium">{String(item[labelField] ?? "")}</span>
              {(item as Record<string, string>).descricao ? <span className="text-sm text-muted-foreground ml-2">— {String((item as Record<string, string>).descricao)}</span> : null}
              {(item as Record<string, string>).codigo ? <span className="text-xs font-mono ml-2 text-muted-foreground">[{String((item as Record<string, string>).codigo)}]</span> : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => startEdit(item)}><Pencil className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}
