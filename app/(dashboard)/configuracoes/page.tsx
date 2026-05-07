"use client"

// Port literal de granum-design/configuracoes-app.jsx + Configuracoes.html
// Estrutura settings-nav vertical preservada

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

type Tab =
  | "empresa"
  | "catalogos"
  | "categorias"
  | "notificacoes"
  | "plano"

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "empresa", label: "Empresa", icon: "building" },
  { id: "catalogos", label: "Catálogos do sistema", icon: "layers" },
  { id: "categorias", label: "Categorias e tags", icon: "folder" },
  { id: "notificacoes", label: "Notificações", icon: "bell" },
  { id: "plano", label: "Plano e cobrança", icon: "dollar" },
]

const CATALOG_DEFS: {
  key: string
  table: string
  fields: string[]
  idField: string
  labelField: string
  title: string
  description: string
}[] = [
  {
    key: "perfis",
    table: "perfil",
    fields: ["nome", "descricao"],
    idField: "id_perfil",
    labelField: "nome",
    title: "Perfis de acesso",
    description: "5 papéis do sistema (diretor, engenheiro, etc).",
  },
  {
    key: "etapas",
    table: "etapa",
    fields: ["codigo", "nome", "descricao", "ordem"],
    idField: "id_etapa",
    labelField: "nome",
    title: "Etapas padrão",
    description: "Modelos de etapas usados ao criar obras.",
  },
  {
    key: "grupos",
    table: "grupo_movimento",
    fields: ["nome", "descricao"],
    idField: "id_grupo",
    labelField: "nome",
    title: "Grupos de movimento",
    description: "Agrupamentos de lançamentos para relatórios.",
  },
  {
    key: "centros",
    table: "centro_custo",
    fields: ["codigo", "nome", "descricao"],
    idField: "id_centro_custo",
    labelField: "nome",
    title: "Centros de custo",
    description: "Centros usados na alocação de despesas.",
  },
]

function Field({
  label,
  value,
  hint,
  type = "text",
  cols = 1,
  readOnly = true,
}: {
  label: string
  value: string
  hint?: string
  type?: string
  cols?: 1 | 2
  readOnly?: boolean
}) {
  return (
    <div className="field" style={{ gridColumn: `span ${cols}` }}>
      <label className="field-label">{label}</label>
      {type === "textarea" ? (
        <textarea
          className="input"
          defaultValue={value}
          rows={3}
          readOnly={readOnly}
        />
      ) : (
        <input
          className="input"
          type={type}
          defaultValue={value}
          readOnly={readOnly}
        />
      )}
      {hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  )
}

function TabEmpresa() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card">
        <div className="card-head">
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Identidade
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              Dados da empresa
            </div>
          </div>
        </div>
        <div className="card-body">
          <div
            style={{
              display: "flex",
              gap: 20,
              marginBottom: 20,
              paddingBottom: 20,
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                background: "var(--surface-muted)",
                border: "1px dashed var(--line-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink-muted)",
                fontSize: 11,
              }}
            >
              logo
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ink)",
                }}
              >
                Logo da empresa
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-muted)",
                  marginTop: 4,
                }}
              >
                PNG ou SVG, fundo transparente. Aparece em relatórios e
                contratos.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled
                >
                  <Icon name="upload" />
                  Enviar arquivo
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <Field label="Razão social" value="Granum (configurar)" cols={2} />
            <Field label="Nome fantasia" value="Granum" />
            <Field label="CNPJ" value="—" />
            <Field label="E-mail institucional" value="—" type="email" />
            <Field label="Telefone" value="—" type="tel" />
            <Field
              label="Endereço"
              value="—"
              cols={2}
              type="textarea"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface CatalogProps {
  table: string
  fields: string[]
  idField: string
  labelField: string
}

function CatalogSection({
  title,
  description,
  ...rest
}: CatalogProps & { title: string; description: string }) {
  const { table, fields, idField, labelField } = rest
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [editing, setEditing] = useState<
    Record<string, unknown> | null | undefined
  >(undefined)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from(table)
      .select("*")
      .order(labelField)
    setItems((data ?? []) as Record<string, unknown>[])
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
      setSaving(false)
      if (error) {
        toast.error("Erro: " + error.message)
        return
      }
      toast.success("Atualizado")
    } else {
      const { error } = await supabase.from(table).insert(payload)
      setSaving(false)
      if (error) {
        toast.error("Erro: " + error.message)
        return
      }
      toast.success("Criado")
    }
    setEditing(undefined)
    load()
  }

  const showForm = editing !== undefined

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-muted)" }}>
            {description}
          </div>
        </div>
        {!showForm ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => startEdit(null)}
          >
            <Icon name="plus" />
            Novo
          </button>
        ) : null}
      </div>

      <div className="card-body">
        {showForm ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 18,
              paddingBottom: 18,
              borderBottom: "1px solid var(--line)",
            }}
          >
            {fields.map((f) => (
              <div
                key={f}
                className="field"
                style={{ gridColumn: f === "descricao" ? "span 2" : "span 1" }}
              >
                <label className="field-label">
                  {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
                </label>
                {f === "descricao" ? (
                  <textarea
                    className="input"
                    rows={2}
                    value={formData[f] ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [f]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    className="input"
                    type={f === "ordem" ? "number" : "text"}
                    value={formData[f] ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [f]: e.target.value })
                    }
                  />
                )}
              </div>
            ))}
            <div
              style={{ gridColumn: "span 2", display: "flex", gap: 8 }}
            >
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Salvando…" : editing ? "Atualizar" : "Salvar"}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(undefined)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}

        <div className="list-table" style={{ border: 0 }}>
          {items.length === 0 ? (
            <div
              style={{
                padding: "20px 0",
                textAlign: "center",
                color: "var(--ink-muted)",
                fontSize: 13,
              }}
            >
              Nenhum registro. Crie o primeiro.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item[idField] as number}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink)",
                      fontWeight: 500,
                    }}
                  >
                    {(item as Record<string, string>).codigo ? (
                      <span className="mono sub" style={{ marginRight: 6 }}>
                        [{String((item as Record<string, string>).codigo)}]
                      </span>
                    ) : null}
                    {String(item[labelField] ?? "")}
                  </div>
                  {(item as Record<string, string>).descricao ? (
                    <div className="sub" style={{ marginTop: 2 }}>
                      {String((item as Record<string, string>).descricao)}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => startEdit(item)}
                >
                  <Icon name="edit" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TabCatalogos() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {CATALOG_DEFS.map((c) => (
        <CatalogSection
          key={c.key}
          table={c.table}
          fields={c.fields}
          idField={c.idField}
          labelField={c.labelField}
          title={c.title}
          description={c.description}
        />
      ))}
    </div>
  )
}

function PlaceholderTab({ title, message }: { title: string; message: string }) {
  return (
    <div className="card">
      <div className="card-body" style={{ padding: 40, textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            margin: "0 auto 12px",
            borderRadius: 24,
            background: "var(--surface-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-muted)",
          }}
        >
          <Icon name="settings" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        <div style={{ marginTop: 6, color: "var(--ink-muted)", fontSize: 13 }}>
          {message}
        </div>
      </div>
    </div>
  )
}

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>("empresa")

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Workspace · Granum</div>
            <h1>Configurações</h1>
            <div className="subtitle">
              Empresa, equipe, permissões e preferências do sistema
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }}
      >
        <nav className="settings-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={"settings-nav-item" + (tab === t.id ? " active" : "")}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div>
          {tab === "empresa" ? <TabEmpresa /> : null}
          {tab === "catalogos" ? <TabCatalogos /> : null}
          {tab === "categorias" ? (
            <PlaceholderTab
              title="Categorias e tags"
              message="Configuração de categorias e tags em desenvolvimento."
            />
          ) : null}
          {tab === "notificacoes" ? (
            <PlaceholderTab
              title="Notificações"
              message="Preferências de notificações por canal em desenvolvimento."
            />
          ) : null}
          {tab === "plano" ? (
            <PlaceholderTab
              title="Plano e cobrança"
              message="Gestão de plano e histórico de faturas em desenvolvimento."
            />
          ) : null}
        </div>
      </div>
    </>
  )
}
