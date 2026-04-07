"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface IntegrationStatus {
  name: string
  status: "online" | "offline" | "not_configured"
  details: Record<string, string>
}

export default function IntegracoesPage() {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkAll() }, [])

  async function checkAll() {
    setLoading(true)
    const results: IntegrationStatus[] = []

    // Supabase
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/", {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      })
      results.push({
        name: "Supabase",
        status: res.ok ? "online" : "offline",
        details: { url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "" },
      })
    } catch {
      results.push({ name: "Supabase", status: "offline", details: {} })
    }

    // n8n
    const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL
    if (n8nUrl) {
      try {
        const res = await fetch(n8nUrl + "/healthz", { signal: AbortSignal.timeout(5000) })
        results.push({ name: "n8n", status: res.ok ? "online" : "offline", details: { url: n8nUrl } })
      } catch {
        results.push({ name: "n8n", status: "offline", details: { url: n8nUrl } })
      }
    } else {
      results.push({ name: "n8n", status: "not_configured", details: {} })
    }

    // Claude API — não testar do frontend (key é server-side)
    results.push({ name: "Claude API", status: "not_configured", details: { nota: "Configurar na Fase 9" } })
    results.push({ name: "SharePoint", status: "not_configured", details: { nota: "Configurar na Fase 9" } })
    results.push({ name: "WhatsApp Bot", status: "not_configured", details: { nota: "Configurar na Fase 9" } })

    setStatuses(results)
    setLoading(false)
  }

  const statusIcon = (s: string) => {
    if (s === "online") return "🟢"
    if (s === "offline") return "🔴"
    return "🟡"
  }

  const statusLabel = (s: string) => {
    if (s === "online") return "Conectado"
    if (s === "offline") return "Offline"
    return "Não configurado"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Integrações</h1>
        <Button variant="outline" onClick={checkAll} disabled={loading}>Testar conexões</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {statuses.map((s) => (
          <Card key={s.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>{statusIcon(s.status)}</span>
                {s.name}
                <span className="text-sm font-normal text-muted-foreground">— {statusLabel(s.status)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {Object.entries(s.details).map(([k, v]) => (
                <p key={k}><strong>{k}:</strong> {v}</p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Webhooks do sistema</h3>
        <div className="text-sm space-y-1 font-mono text-muted-foreground">
          <p>POST /api/webhooks/n8n — recebe dados do n8n</p>
          <p>POST /api/webhooks/whatsapp — recebe áudios</p>
          <p>POST /api/claude/diario — gera diário via IA</p>
          <p>POST /api/claude/orcamento — gera orçamento</p>
          <p>POST /api/claude/relatorio — gera relatório</p>
          <p>GET /api/cron/parcelas — atualiza parcelas atrasadas</p>
        </div>
      </div>
    </div>
  )
}
