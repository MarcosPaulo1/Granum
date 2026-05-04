"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react"

import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type IntegrationStatus = "online" | "offline" | "not_configured"

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: IntegrationStatus
  details: { label: string; value: string }[]
}

const STATUS_META: Record<
  IntegrationStatus,
  {
    label: string
    tone: "success" | "danger" | "neutral"
    Icon: React.ComponentType<{ className?: string }>
  }
> = {
  online: { label: "Conectado", tone: "success", Icon: CheckCircle2 },
  offline: { label: "Offline", tone: "danger", Icon: XCircle },
  not_configured: { label: "Não configurado", tone: "neutral", Icon: Sparkles },
}

const WEBHOOKS = [
  { method: "POST", path: "/api/webhooks/n8n", note: "Recebe dados do n8n" },
  { method: "POST", path: "/api/webhooks/whatsapp", note: "Recebe áudios/mensagens" },
  { method: "POST", path: "/api/claude/diario", note: "Gera diário via Claude" },
  { method: "POST", path: "/api/claude/orcamento", note: "Gera orçamento" },
  { method: "POST", path: "/api/claude/relatorio", note: "Gera relatório" },
  { method: "GET", path: "/api/cron/parcelas", note: "Atualiza parcelas atrasadas (cron)" },
]

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAll()
  }, [])

  async function checkAll() {
    setIsLoading(true)
    const results: Integration[] = []

    // Supabase
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
      const res = await fetch(url + "/rest/v1/", {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
      })
      results.push({
        id: "supabase",
        name: "Supabase",
        description: "Banco de dados, autenticação e RLS",
        icon: Database,
        status: res.ok ? "online" : "offline",
        details: [{ label: "URL", value: url }],
      })
    } catch {
      results.push({
        id: "supabase",
        name: "Supabase",
        description: "Banco de dados, autenticação e RLS",
        icon: Database,
        status: "offline",
        details: [],
      })
    }

    // n8n
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL
    if (n8nUrl) {
      try {
        const res = await fetch(n8nUrl + "/healthz", {
          signal: AbortSignal.timeout(5000),
        })
        results.push({
          id: "n8n",
          name: "n8n",
          description: "Automação de workflows e integrações",
          icon: Webhook,
          status: res.ok ? "online" : "offline",
          details: [{ label: "URL", value: n8nUrl }],
        })
      } catch {
        results.push({
          id: "n8n",
          name: "n8n",
          description: "Automação de workflows e integrações",
          icon: Webhook,
          status: "offline",
          details: [{ label: "URL", value: n8nUrl }],
        })
      }
    } else {
      results.push({
        id: "n8n",
        name: "n8n",
        description: "Automação de workflows e integrações",
        icon: Webhook,
        status: "not_configured",
        details: [],
      })
    }

    results.push({
      id: "claude",
      name: "Claude API",
      description: "Geração de diários, orçamentos e relatórios via IA",
      icon: Sparkles,
      status: "not_configured",
      details: [{ label: "Notas", value: "Configurar na próxima fase" }],
    })

    results.push({
      id: "sharepoint",
      name: "SharePoint",
      description: "Armazenamento de documentos e arquivos da obra",
      icon: Cloud,
      status: "not_configured",
      details: [{ label: "Notas", value: "Configurar na próxima fase" }],
    })

    results.push({
      id: "whatsapp",
      name: "WhatsApp Bot",
      description: "Recebimento de áudios e mensagens do canteiro",
      icon: MessageCircle,
      status: "not_configured",
      details: [{ label: "Notas", value: "Configurar na próxima fase" }],
    })

    results.push({
      id: "vercel",
      name: "Vercel",
      description: "Hospedagem e deploy automático do frontend",
      icon: Zap,
      status: "online",
      details: [{ label: "Ambiente", value: "Produção" }],
    })

    setIntegrations(results)
    setIsLoading(false)
  }

  const onlineCount = integrations.filter((i) => i.status === "online").length
  const offlineCount = integrations.filter((i) => i.status === "offline").length
  const pendingCount = integrations.filter(
    (i) => i.status === "not_configured"
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistema · Conexões externas"
        title="Integrações"
        subtitle="Status das conexões com serviços externos e webhooks"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={checkAll}
            disabled={isLoading}
          >
            <RefreshCw
              data-icon="inline-start"
              className={isLoading ? "animate-spin" : ""}
            />
            {isLoading ? "Testando…" : "Testar conexões"}
          </Button>
        }
      />

      <KpiGrid cols={3}>
        <KpiCard
          tone="success"
          label="Conectadas"
          value={onlineCount}
          sub="Funcionando"
          icon={<CheckCircle2 />}
        />
        <KpiCard
          tone={offlineCount > 0 ? "danger" : "neutral"}
          label="Offline"
          value={offlineCount}
          sub={offlineCount > 0 ? "Precisam atenção" : "Tudo certo"}
          icon={<XCircle />}
        />
        <KpiCard
          label="Não configuradas"
          value={pendingCount}
          sub="Em fases futuras"
          icon={<Sparkles />}
        />
      </KpiGrid>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => {
          const meta = STATUS_META[i.status]
          const Icon = i.icon
          return (
            <Card
              key={i.id}
              className="transition-colors hover:border-primary/40"
            >
              <CardContent className="space-y-3 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[14.5px] font-semibold text-foreground">
                        {i.name}
                      </h3>
                      <p className="text-[12px] text-muted-foreground">
                        {i.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <CategoryChip tone={meta.tone}>
                    <meta.Icon className="size-3" />
                    {meta.label}
                  </CategoryChip>
                  {i.status === "not_configured" ? (
                    <Button variant="ghost" size="sm" disabled>
                      Configurar
                      <ExternalLink data-icon="inline-end" />
                    </Button>
                  ) : null}
                </div>
                {i.details.length > 0 ? (
                  <dl className="border-t border-border pt-2 text-[11.5px]">
                    {i.details.map((d) => (
                      <div
                        key={d.label}
                        className="flex justify-between gap-2 py-0.5"
                      >
                        <dt className="text-muted-foreground">{d.label}</dt>
                        <dd className="mono max-w-[200px] truncate tabular-nums text-foreground">
                          {d.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="space-y-3 py-5">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">
              Webhooks do sistema
            </h3>
            <p className="text-[12px] text-muted-foreground">
              Endpoints internos disponíveis para integrações externas
            </p>
          </div>
          <ul className="divide-y divide-border rounded-md border border-border">
            {WEBHOOKS.map((w) => (
              <li
                key={w.path}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryChip
                    tone={w.method === "GET" ? "info" : "primary"}
                  >
                    <span className="mono">{w.method}</span>
                  </CategoryChip>
                  <span className="mono truncate text-[12.5px] tabular-nums text-foreground">
                    {w.path}
                  </span>
                </div>
                <span className="hidden truncate text-[11.5px] text-muted-foreground sm:inline">
                  {w.note}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
