"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
import { Button } from "@/components/ui/button"
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

const TIPO_COLORS: Record<string, { bg: string; fg: string }> = {
  projeto: { bg: "var(--info-soft)", fg: "var(--info-ink)" },
  foto: {
    bg: "color-mix(in oklab, var(--primary) 14%, var(--surface-muted))",
    fg: "var(--primary)",
  },
  transcricao: { bg: "var(--warning-soft)", fg: "var(--warning-ink)" },
  contrato: { bg: "var(--success-soft)", fg: "var(--success-ink)" },
}

export function DocumentosTab({ obraId }: { obraId: number }) {
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
      toast.error("Nome obrigatório")
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
    <>
      <div className="card">
        <div className="card-head">
          <h3>
            <Icon name="folder" />
            Documentos · {docs.length}
          </h3>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setFormOpen(true)}
          >
            <Icon name="plus" />
            Adicionar
          </button>
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
        ) : docs.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              color: "var(--ink-muted)",
              fontSize: 13.5,
            }}
          >
            Nenhum documento. Adicione o primeiro.
          </div>
        ) : (
          <div className="list-table">
            <div className="list-thead">
              <div>Documento</div>
              <div>Tipo</div>
              <div>Data</div>
              <div></div>
            </div>
            {docs.map((d) => {
              const meta = DOCUMENTO_TIPO[
                d.tipo as keyof typeof DOCUMENTO_TIPO
              ] as { label: string } | undefined
              const tipoColor = TIPO_COLORS[d.tipo] ?? {
                bg: "var(--surface-muted)",
                fg: "var(--ink-muted)",
              }
              return (
                <div
                  className="list-row2"
                  key={d.id_documento}
                  style={{
                    gridTemplateColumns: "minmax(280px, 2fr) 140px 160px 40px",
                  }}
                >
                  <div className="list-cell-name">
                    <span
                      className="lanc-icon"
                      style={{
                        background: "var(--surface-muted)",
                        color: "var(--ink-muted)",
                      }}
                    >
                      <Icon name="fileText" />
                    </span>
                    <div className="list-name-block">
                      <div className="nm">{d.nome}</div>
                    </div>
                  </div>
                  <div>
                    <span
                      className="tipo-tag"
                      style={{
                        background: tipoColor.bg,
                        color: tipoColor.fg,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {meta?.label ?? d.tipo}
                    </span>
                  </div>
                  <div className="em mono">{formatDateTime(d.data_criacao)}</div>
                  <div className="list-cell-actions">
                    {d.url_sharepoint ? (
                      <a
                        href={d.url_sharepoint}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="icon-btn"
                        title="Abrir no SharePoint"
                      >
                        <Icon name="external" />
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
    </>
  )
}
