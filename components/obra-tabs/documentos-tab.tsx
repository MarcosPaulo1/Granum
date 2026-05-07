"use client"

import { useCallback, useEffect, useState } from "react"
import { ExternalLink, FileText, Plus } from "lucide-react"
import { toast } from "sonner"

import { CategoryChip } from "@/components/shared/category-chip"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { DOCUMENTO_TIPO } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatDateTime } from "@/lib/utils/format"

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

const TIPO_TONE: Record<
  string,
  "primary" | "info" | "warning" | "success" | "neutral"
> = {
  projeto: "info",
  foto: "primary",
  transcricao: "warning",
  contrato: "success",
}

export function DocumentosTab({ obraId }: DocumentosTabProps) {
  const [docs, setDocs] = useState<Documento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState("outro")
  const [url, setUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("documento")
      .select("*")
      .eq("id_obra", obraId)
      .order("data_criacao", { ascending: false })
    setDocs((data ?? []) as Documento[])
    setIsLoading(false)
  }, [obraId])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd() {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("documento").insert({
      id_obra: obraId,
      nome: nome.trim(),
      tipo,
      url_sharepoint: url.trim() || null,
    })
    setSaving(false)
    if (error) {
      toast.error("Erro: " + error.message)
      return
    }
    toast.success("Documento adicionado")
    setNome("")
    setUrl("")
    setTipo("outro")
    setFormOpen(false)
    load()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">
              Documentos
            </h3>
            <p className="text-[12px] text-muted-foreground">
              {docs.length} documento{docs.length === 1 ? "" : "s"}
              {" · "}armazenados no SharePoint
            </p>
          </div>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus data-icon="inline-start" />
            Adicionar
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Carregando documentos…
          </CardContent>
        </Card>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="size-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Nenhum documento ainda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {docs.map((d) => {
                const tipoMeta = DOCUMENTO_TIPO[
                  d.tipo as keyof typeof DOCUMENTO_TIPO
                ] as { label: string } | undefined
                return (
                  <div
                    key={d.id_documento}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-medium text-foreground">
                          {d.nome}
                        </div>
                        <div className="text-[11.5px] text-muted-foreground tabular-nums">
                          {formatDateTime(d.data_criacao)}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <CategoryChip tone={TIPO_TONE[d.tipo] ?? "neutral"}>
                        {tipoMeta?.label ?? d.tipo}
                      </CategoryChip>
                      {d.url_sharepoint ? (
                        <a
                          href={d.url_sharepoint}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Abrir no SharePoint"
                          >
                            <ExternalLink />
                          </Button>
                        </a>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENTO_TIPO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {(v as { label: string }).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL SharePoint</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
