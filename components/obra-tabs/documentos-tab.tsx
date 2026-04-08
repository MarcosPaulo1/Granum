"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import { DOCUMENTO_TIPO } from "@/lib/constants"
import { formatDateTime } from "@/lib/utils/format"
import { Plus, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface Documento {
  id_documento: number
  tipo: string
  nome: string
  url_sharepoint: string | null
  data_criacao: string
}

interface DocumentosTabProps {
  obraId: number
}

export function DocumentosTab({ obraId }: DocumentosTabProps) {
  const [docs, setDocs] = useState<Documento[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState("outro")
  const [url, setUrl] = useState("")

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from("documento").select("*").eq("id_obra", obraId).order("data_criacao", { ascending: false })
    setDocs((data ?? []) as Documento[])
  }, [obraId])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!nome) { toast.error("Nome é obrigatório"); return }
    const supabase = createClient()
    const { error } = await supabase.from("documento").insert({
      id_obra: obraId,
      nome,
      tipo,
      url_sharepoint: url || null,
    })
    if (error) { toast.error("Erro: " + error.message); return }
    toast.success("Documento adicionado")
    setNome(""); setUrl(""); setFormOpen(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Documentos</h3>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
      </div>

      <div className="space-y-2">
        {docs.map((d) => (
          <div key={d.id_documento} className="flex items-center justify-between border rounded p-3">
            <div>
              <p className="font-medium">{d.nome}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(d.data_criacao)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={d.tipo} statusMap={DOCUMENTO_TIPO} />
              {d.url_sharepoint && (
                <a href={d.url_sharepoint} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                </a>
              )}
            </div>
          </div>
        ))}
        {docs.length === 0 && <p className="text-muted-foreground text-sm">Nenhum documento.</p>}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo documento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENTO_TIPO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>URL SharePoint</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>
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
