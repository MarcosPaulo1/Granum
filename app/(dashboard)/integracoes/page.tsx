"use client"

// Port literal de granum-design/integracoes-app.jsx + Integracoes.html

import { useEffect, useState, type ReactNode } from "react"

import { Icon } from "@/components/granum/icon"

interface Integration {
  id: string
  nome: string
  cat:
    | "financeiro"
    | "comunicacao"
    | "produtividade"
    | "armazenamento"
    | "desenvolvedor"
  desc: string
  status: "conectado" | "erro" | "disponivel"
  badge: "success" | "danger" | "soft"
  info?: string
  logoSeed: string
}

const INTEGRATIONS: Integration[] = [
  {
    id: "supabase",
    nome: "Supabase",
    cat: "desenvolvedor",
    desc: "Banco de dados, autenticação e armazenamento. Backend principal do Granum.",
    status: "conectado",
    badge: "success",
    info: "Conectado · DB e auth ativos",
    logoSeed: "SB",
  },
  {
    id: "n8n",
    nome: "n8n",
    cat: "desenvolvedor",
    desc: "Automações de workflows: notificações, integrações com bancos e geração de relatórios.",
    status: "disponivel",
    badge: "soft",
    logoSeed: "N8",
  },
  {
    id: "claude",
    nome: "Claude API",
    cat: "produtividade",
    desc: "IA para gerar diários de obra, orçamentos e relatórios automáticos a partir de áudios.",
    status: "disponivel",
    badge: "soft",
    logoSeed: "CL",
  },
  {
    id: "sharepoint",
    nome: "SharePoint",
    cat: "armazenamento",
    desc: "Sincroniza projetos arquitetônicos, fotos e documentos das obras com o OneDrive corporativo.",
    status: "disponivel",
    badge: "soft",
    logoSeed: "SP",
  },
  {
    id: "whatsapp",
    nome: "WhatsApp Bot",
    cat: "comunicacao",
    desc: "Recebe áudios e fotos do canteiro pelo WhatsApp e gera diários automaticamente.",
    status: "disponivel",
    badge: "soft",
    logoSeed: "WA",
  },
  {
    id: "vercel",
    nome: "Vercel",
    cat: "desenvolvedor",
    desc: "Hospedagem do frontend com deploy automático a cada push.",
    status: "conectado",
    badge: "success",
    info: "Ambiente: Produção · Deploys automáticos",
    logoSeed: "VC",
  },
  {
    id: "google-cal",
    nome: "Google Calendar",
    cat: "produtividade",
    desc: "Sincroniza marcos e prazos das obras com sua agenda pessoal.",
    status: "disponivel",
    badge: "soft",
    logoSeed: "GC",
  },
  {
    id: "google-drive",
    nome: "Google Drive",
    cat: "armazenamento",
    desc: "Backup automático de relatórios e documentos exportados.",
    status: "disponivel",
    badge: "soft",
    logoSeed: "GD",
  },
  {
    id: "webhook",
    nome: "Webhooks",
    cat: "desenvolvedor",
    desc: "Receba eventos do Granum em endpoints HTTP próprios para automação customizada.",
    status: "disponivel",
    badge: "soft",
    logoSeed: "WH",
  },
]

function Logo({ seed }: { seed: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background:
          "color-mix(in oklab, var(--primary) 12%, var(--surface-muted))",
        color: "var(--primary)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.04em",
      }}
    >
      {seed}
    </div>
  )
}

export default function IntegracoesPage() {
  const [filter, setFilter] = useState<"todas" | Integration["cat"]>("todas")
  const [items, setItems] = useState<Integration[]>(INTEGRATIONS)

  useEffect(() => {
    // Healthcheck Supabase
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return
    fetch(url + "/rest/v1/", { headers: { apikey: key } })
      .then((r) => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === "supabase"
              ? {
                  ...i,
                  status: r.ok ? "conectado" : "erro",
                  badge: r.ok ? "success" : "danger",
                }
              : i
          )
        )
      })
      .catch(() => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === "supabase"
              ? { ...i, status: "erro", badge: "danger" }
              : i
          )
        )
      })
  }, [])

  const cats = [
    { id: "todas" as const, label: "Todas", n: items.length },
    {
      id: "financeiro" as const,
      label: "Financeiro",
      n: items.filter((i) => i.cat === "financeiro").length,
    },
    {
      id: "comunicacao" as const,
      label: "Comunicação",
      n: items.filter((i) => i.cat === "comunicacao").length,
    },
    {
      id: "produtividade" as const,
      label: "Produtividade",
      n: items.filter((i) => i.cat === "produtividade").length,
    },
    {
      id: "armazenamento" as const,
      label: "Armazenamento",
      n: items.filter((i) => i.cat === "armazenamento").length,
    },
    {
      id: "desenvolvedor" as const,
      label: "Desenvolvedor",
      n: items.filter((i) => i.cat === "desenvolvedor").length,
    },
  ]

  const filtered =
    filter === "todas" ? items : items.filter((i) => i.cat === filter)
  const conectadas = items.filter((i) => i.status === "conectado").length
  const erros = items.filter((i) => i.status === "erro").length

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">
              Marketplace · {items.length} integrações disponíveis
            </div>
            <h1>Integrações</h1>
            <div className="subtitle">
              Conecte o Granum aos sistemas que você já usa
            </div>
          </div>
          <div className="page-head-actions">
            <button className="btn btn-ghost" type="button" disabled>
              <Icon name="activity" />
              Ver logs
            </button>
            <button className="btn btn-secondary" type="button" disabled>
              <Icon name="key" />
              API e webhooks
            </button>
          </div>
        </div>
      </div>

      <div
        className="list-kpis"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        <div className="list-kpi tone-success">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Conectadas</div>
            <div className="kpi-icon">
              <Icon name="check" />
            </div>
          </div>
          <div className="list-kpi-value fin-pos">{conectadas}</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            Funcionando normalmente
          </div>
        </div>
        <div className="list-kpi tone-danger">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Com erro</div>
            <div className="kpi-icon">
              <Icon name="alertTriangle" />
            </div>
          </div>
          <div className="list-kpi-value fin-neg">{erros}</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            {erros > 0 ? "Atenção necessária" : "Tudo certo"}
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Eventos processados (30d)</div>
          <div className="list-kpi-value mono">—</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            Estatísticas em desenvolvimento
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="seg" style={{ marginBottom: 14 }}>
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={"seg-btn" + (filter === c.id ? " active" : "")}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
              <span style={{ marginLeft: 6, color: "var(--ink-muted)" }}>
                {c.n}
              </span>
            </button>
          ))}
        </div>

        <div className="int-grid">
          {filtered.map((it) => (
            <div className="int-card" key={it.id}>
              <div className="int-head">
                <Logo seed={it.logoSeed} />
                {it.status === "conectado" ? (
                  <span className="badge badge-success">● Conectado</span>
                ) : it.status === "erro" ? (
                  <span className="badge badge-danger">● Erro</span>
                ) : (
                  <span className="badge badge-soft">Disponível</span>
                )}
              </div>
              <div className="int-body">
                <div className="int-name">{it.nome}</div>
                <div className="int-desc">{it.desc}</div>
                {it.info ? <div className="int-info">{it.info}</div> : null}
              </div>
              <div className="int-foot">
                {it.status === "conectado" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled
                    >
                      Configurar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled
                    >
                      Desconectar
                    </button>
                  </>
                ) : it.status === "erro" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled
                    >
                      Ver log
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled
                    >
                      <Icon name="refresh" />
                      Reconectar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ width: "100%" }}
                    disabled
                  >
                    <Icon name="plus" />
                    Conectar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
