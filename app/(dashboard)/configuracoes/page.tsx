"use client"

import { useCallback, useEffect, useState } from "react"
import {
  FolderTree,
  Layers,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { CategoryChip } from "@/components/shared/category-chip"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type SectionKey = "perfis" | "etapas" | "grupos" | "centros"

const SECTIONS: {
  key: SectionKey
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  table: string
  fields: string[]
  idField: string
  labelField: string
}[] = [
  {
    key: "perfis",
    title: "Perfis de acesso",
    description:
      "Define os 5 papéis do sistema (diretor, engenheiro, financeiro, arquiteta, mestre).",
    icon: ShieldCheck,
    table: "perfil",
    fields: ["nome", "descricao"],
    idField: "id_perfil",
    labelField: "nome",
  },
  {
    key: "etapas",
    title: "Etapas padrão",
    description:
      "Modelos de etapas usados ao criar novas obras (fundação, estrutura, alvenaria, etc).",
    icon: Layers,
    table: "etapa",
    fields: ["codigo", "nome", "descricao", "ordem"],
    idField: "id_etapa",
    labelField: "nome",
  },
  {
    key: "grupos",
    title: "Grupos de movimento",
    description:
      "Agrupamentos de lançamentos para relatórios financeiros (mão de obra, material, etc).",
    icon: FolderTree,
    table: "grupo_movimento",
    fields: ["nome", "descricao"],
    idField: "id_grupo",
    labelField: "nome",
  },
  {
    key: "centros",
    title: "Centros de custo",
    description:
      "Centros de custo para alocação de despesas. Toda obra é vinculada a um.",
    icon: Settings2,
    table: "centro_custo",
    fields: ["codigo", "nome", "descricao"],
    idField: "id_centro_custo",
    labelField: "nome",
  },
]

export default function ConfiguracoesPage() {
  const [active, setActive] = useState<SectionKey>("perfis")
  const section = SECTIONS.find((s) => s.key === active)!

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistema · Administração"
        title="Configurações"
        subtitle="Catálogos do sistema, perfis de acesso e estrutura financeira"
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="space-y-1">
          {SECTIONS.map((s) => {
            const isActive = s.key === active
            const Icon = s.icon
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                    : "hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md",
                    isActive
                      ? "bg-accent text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[13px] font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">
                    {s.description}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-1 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <p className="text-[12.5px] text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <CrudSection
            key={active}
            table={section.table}
            fields={section.fields}
            idField={section.idField}
            labelField={section.labelField}
          />
        </div>
      </div>
    </div>
  )
}

interface CrudProps {
  table: string
  fields: string[]
  idField: string
  labelField: string
}

function CrudSection({ table, fields, idField, labelField }: CrudProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [editing, setEditing] = useState<
    Record<string, unknown> | null | undefined
  >(undefined)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(labelField)
    if (error) {
      toast.error("Erro ao carregar: " + error.message)
    }
    setItems((data ?? []) as Record<string, unknown>[])
    setIsLoading(false)
  }, [table, labelField])

  useEffect(() => {
    load()
  }, [load])

  function startEdit(item: Record<string, unknown> | null) {
    setEditing(item)
    if (item) {
      const fd: Record<string, string> = {}
      fields.forEach((f) => (fd[f] = String(item[f] ?? "")))
      setFormData(fd)
    } else {
      setFormData(Object.fromEntries(fields.map((f) => [f, ""])))
    }
  }

  function cancelEdit() {
    setEditing(undefined)
    setFormData({})
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const payload: Record<string, unknown> = {}
    fields.forEach((f) => {
      if (f === "ordem") payload[f] = Number(formData[f]) || 0
      else payload[f] = formData[f] || null
    })

    if (editing) {
      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq(idField, editing[idField] as number)
      if (error) {
        setSaving(false)
        toast.error("Erro: " + error.message)
        return
      }
      toast.success("Atualizado")
    } else {
      const { error } = await supabase.from(table).insert(payload)
      if (error) {
        setSaving(false)
        toast.error("Erro: " + error.message)
        return
      }
      toast.success("Criado")
    }
    setSaving(false)
    cancelEdit()
    load()
  }

  const showForm = editing !== undefined

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-muted-foreground">
          {items.length} registro{items.length === 1 ? "" : "s"}
        </span>
        {!showForm ? (
          <Button size="sm" onClick={() => startEdit(null)}>
            <Plus data-icon="inline-start" />
            Novo
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <Card>
          <CardContent className="space-y-3 py-5">
            <h3 className="text-[14px] font-semibold text-foreground">
              {editing ? "Editar registro" : "Novo registro"}
            </h3>
            {fields.map((f) => (
              <div key={f}>
                <Label className="capitalize">{f.replace("_", " ")}</Label>
                {f === "descricao" ? (
                  <Textarea
                    value={formData[f] ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, [f]: e.target.value }))
                    }
                  />
                ) : (
                  <Input
                    value={formData[f] ?? ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, [f]: e.target.value }))
                    }
                    type={f === "ordem" ? "number" : "text"}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Salvando…" : editing ? "Atualizar" : "Salvar"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Carregando…
            </div>
          ) : items.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nenhum registro. Crie o primeiro.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li
                  key={item[idField] as number}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {(item as Record<string, string>).codigo ? (
                        <CategoryChip tone="neutral">
                          <span className="mono tabular-nums">
                            {String((item as Record<string, string>).codigo)}
                          </span>
                        </CategoryChip>
                      ) : null}
                      <span className="text-[13.5px] font-medium text-foreground">
                        {String(item[labelField] ?? "")}
                      </span>
                      {typeof item.ordem === "number" ? (
                        <CategoryChip tone="info">ordem {item.ordem as number}</CategoryChip>
                      ) : null}
                    </div>
                    {(item as Record<string, string>).descricao ? (
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {String((item as Record<string, string>).descricao)}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(item)}
                    aria-label="Editar"
                  >
                    <Pencil />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

