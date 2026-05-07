"use client"

// Port literal de granum-design/responsaveis-app.jsx + Responsaveis.html

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ResponsavelForm } from "@/components/forms/responsavel-form"
import { Icon } from "@/components/granum/icon"
import { ROLES, type Role } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils/format"

interface RespRow {
  id: string
  rawId: number
  nome: string
  init: string
  perfil: Role | string
  cargo: string
  depto: string
  email: string
  fone: string
  admissao: string
  obras: number
  tarefas: number
  status: "ativo" | "inativo"
}

const PERFIL_META: Record<
  string,
  { label: string; bg: string; fg: string; dot: string }
> = {
  diretor: {
    label: "Diretor(a)",
    bg: "color-mix(in oklab, var(--primary) 22%, var(--surface-muted))",
    fg: "var(--primary)",
    dot: "var(--primary)",
  },
  arquiteta: {
    label: "Arquiteta",
    bg: "color-mix(in oklab, var(--info) 22%, var(--surface-muted))",
    fg: "var(--info-ink)",
    dot: "var(--info)",
  },
  engenheiro: {
    label: "Engenheiro(a)",
    bg: "color-mix(in oklab, var(--success) 20%, var(--surface-muted))",
    fg: "var(--success-ink)",
    dot: "var(--success)",
  },
  mestre_obra: {
    label: "Mestre de obras",
    bg: "color-mix(in oklab, var(--warning) 24%, var(--surface-muted))",
    fg: "var(--warning-ink)",
    dot: "var(--warning)",
  },
  financeiro: {
    label: "Financeiro",
    bg: "var(--surface-muted)",
    fg: "var(--ink)",
    dot: "var(--ink-soft)",
  },
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function PerfilBadge({ p }: { p: string }) {
  const m =
    PERFIL_META[p] ?? {
      label: (ROLES as Record<string, string>)[p] ?? p,
      bg: "var(--surface-muted)",
      fg: "var(--ink)",
      dot: "var(--ink-soft)",
    }
  return (
    <span
      className="badge"
      style={{ background: m.bg, color: m.fg, fontWeight: 500 }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: m.dot,
          display: "inline-block",
          marginRight: 6,
        }}
      />
      {m.label}
    </span>
  )
}

function StatusBadge({ s }: { s: RespRow["status"] }) {
  return s === "ativo" ? (
    <span className="badge dot badge-success">Ativo</span>
  ) : (
    <span className="badge dot badge-neutral">Inativo</span>
  )
}

export default function ResponsaveisPage() {
  const router = useRouter()
  const [rows, setRows] = useState<RespRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fPerfil, setFPerfil] = useState<"todos" | string>("todos")
  const [fDepto, setFDepto] = useState<"todos" | string>("todos")
  const [fStatus, setFStatus] = useState<"todos" | "ativo" | "inativo">(
    "todos"
  )
  const [busca, setBusca] = useState("")
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: resps, error } = await supabase
      .from("responsavel")
      .select(
        "id_responsavel, nome, cargo, departamento, email, telefone, ativo, data_admissao, id_perfil"
      )
      .order("nome")

    if (error) {
      toast.error("Erro: " + error.message)
      setIsLoading(false)
      return
    }

    const { data: perfis } = await supabase
      .from("perfil")
      .select("id_perfil, nome")
    const perfilMap = new Map(
      (perfis ?? []).map((p) => [p.id_perfil, p.nome as string])
    )

    setRows(
      (resps ?? []).map((r) => ({
        id: `RSP-${String(r.id_responsavel).padStart(3, "0")}`,
        rawId: r.id_responsavel,
        nome: r.nome,
        init: getInitials(r.nome),
        perfil: perfilMap.get(r.id_perfil) ?? "outro",
        cargo: r.cargo ?? "",
        depto: r.departamento ?? "",
        email: r.email ?? "",
        fone: r.telefone ?? "",
        admissao: r.data_admissao ? formatDate(r.data_admissao) : "—",
        obras: 0,
        tarefas: 0,
        status: r.ativo === false ? "inativo" : "ativo",
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const deptos = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.depto).filter(Boolean))).sort(),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (fPerfil !== "todos" && r.perfil !== fPerfil) return false
        if (fDepto !== "todos" && r.depto !== fDepto) return false
        if (fStatus !== "todos" && r.status !== fStatus) return false
        if (
          busca &&
          !(r.nome + r.email + r.cargo)
            .toLowerCase()
            .includes(busca.toLowerCase())
        )
          return false
        return true
      }),
    [rows, fPerfil, fDepto, fStatus, busca]
  )

  const ativos = rows.filter((r) => r.status === "ativo").length
  const byPerfil = (p: string) =>
    rows.filter((r) => r.perfil === p && r.status === "ativo").length

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Cadastros · Equipe interna</div>
            <h1>Responsáveis</h1>
            <div className="subtitle">
              {rows.length} pessoas cadastradas · {ativos} ativas ·{" "}
              {deptos.length} departamentos
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-secondary" type="button" disabled>
              <Icon name="download" />
              Exportar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setFormOpen(true)}
            >
              <Icon name="plus" />
              Novo responsável
            </button>
          </div>
        </div>
      </div>

      <div className="list-kpis">
        <div className="list-kpi">
          <div className="list-kpi-label">Diretoria</div>
          <div className="list-kpi-value">{byPerfil("diretor")}</div>
          <div className="list-kpi-sub">
            <Icon name="briefcase" />
            Com acesso total
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Arquitetura</div>
          <div className="list-kpi-value">{byPerfil("arquiteta")}</div>
          <div className="list-kpi-sub">
            <Icon name="layout" />
            Projetos em andamento
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Execução</div>
          <div className="list-kpi-value">
            {byPerfil("engenheiro") + byPerfil("mestre_obra")}
          </div>
          <div className="list-kpi-sub">
            <Icon name="hammer" />
            Engenheiros e mestres
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Financeiro</div>
          <div className="list-kpi-value">{byPerfil("financeiro")}</div>
          <div className="list-kpi-sub">
            <Icon name="dollar" />
            Lançamentos e pagamentos
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head list-toolbar">
          <div className="list-search">
            <Icon name="search" />
            <input
              type="text"
              placeholder="Buscar por nome, cargo ou e-mail…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="list-filters">
            <select
              className="seg-select"
              value={fPerfil}
              onChange={(e) => setFPerfil(e.target.value)}
            >
              <option value="todos">Todos perfis</option>
              <option value="diretor">Diretor</option>
              <option value="arquiteta">Arquiteta</option>
              <option value="engenheiro">Engenheiro</option>
              <option value="mestre_obra">Mestre</option>
              <option value="financeiro">Financeiro</option>
            </select>
            <select
              className="seg-select"
              value={fDepto}
              onChange={(e) => setFDepto(e.target.value)}
            >
              <option value="todos">Todos departamentos</option>
              {deptos.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <div className="seg">
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "ativo", label: "Ativos" },
                  { id: "inativo", label: "Inativos" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={"seg-btn" + (fStatus === t.id ? " active" : "")}
                  onClick={() => setFStatus(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="list-table">
          <div className="list-thead">
            <div>Nome</div>
            <div>Cargo · Departamento</div>
            <div>Contato</div>
            <div>Perfil</div>
            <div className="num">Obras · Tarefas</div>
            <div>Status</div>
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
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                color: "var(--ink-muted)",
                fontSize: 13.5,
              }}
            >
              Nenhum responsável encontrado.
            </div>
          ) : (
            filtered.map((r) => (
              <div
                className="list-row2"
                key={r.id}
                onClick={() => router.push(`/responsaveis/${r.rawId}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="list-cell-name">
                  <span className="avatar-sm">{r.init}</span>
                  <div className="list-name-block">
                    <div className="nm">
                      <a>{r.nome}</a>
                    </div>
                    <div className="sub">
                      {r.id} · Admissão {r.admissao}
                    </div>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink)",
                      fontWeight: 500,
                    }}
                  >
                    {r.cargo || "—"}
                  </div>
                  <div className="sub">{r.depto || "—"}</div>
                </div>
                <div className="list-cell-contact">
                  <div className="em">{r.email || "—"}</div>
                  {r.fone ? <div className="sub mono">{r.fone}</div> : null}
                </div>
                <div>
                  <PerfilBadge p={r.perfil} />
                </div>
                <div className="list-cell-num">
                  <div className="val mono">{r.obras}</div>
                  <div className="sub">{r.tarefas} tarefas</div>
                </div>
                <div className="list-cell-status">
                  <StatusBadge s={r.status} />
                </div>
                <div className="list-cell-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Mais ações"
                  >
                    <Icon name="more" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="list-foot">
          <div className="sub">
            Mostrando {filtered.length} de {rows.length} responsáveis
          </div>
          <div className="list-pag">
            <button className="icon-btn" disabled>
              <Icon name="chevronLeft" />
            </button>
            <span className="mono">1 / 1</span>
            <button className="icon-btn" disabled>
              <Icon name="chevronRight" />
            </button>
          </div>
        </div>
      </div>

      <ResponsavelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={load}
      />
    </>
  )
}
