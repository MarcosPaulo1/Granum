"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react"

import { ClienteForm } from "@/components/forms/cliente-form"
import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { ProgressBar } from "@/components/shared/progress-bar"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { OBRA_STATUS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatCPFCNPJ, formatDate, formatPhone } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Cliente = Database["public"]["Tables"]["cliente"]["Row"]

interface ObraResumida {
  id_obra: number
  nome: string
  status: string
  percentual_finalizada: number
  data_inicio_prevista: string | null
}

const ACTIVE_STATUSES = new Set(["em_andamento", "planejamento"])

function detectTipo(cpfCnpj: string | null): "PF" | "PJ" {
  if (!cpfCnpj) return "PF"
  return cpfCnpj.replace(/\D/g, "").length >= 14 ? "PJ" : "PF"
}

function clienteCode(id: number) {
  return `CLI-${String(id).padStart(4, "0")}`
}

export default function ClientePerfilPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [obras, setObras] = useState<ObraResumida[]>([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)
    const { data: c } = await supabase
      .from("cliente")
      .select("*")
      .eq("id_cliente", id)
      .single()
    setCliente(c)
    const { data: o } = await supabase
      .from("obra")
      .select(
        "id_obra, nome, status, percentual_finalizada, data_inicio_prevista"
      )
      .eq("id_cliente", id)
      .order("created_at", { ascending: false })
    setObras((o as ObraResumida[]) ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!cliente) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Carregando cliente…
      </div>
    )
  }

  const tipo = detectTipo(cliente.cpf_cnpj)
  const obrasAtivas = obras.filter((o) => ACTIVE_STATUSES.has(o.status)).length
  const obrasConcluidas = obras.filter((o) => o.status === "concluida").length
  const progressoMedio =
    obras.length === 0
      ? 0
      : Math.round(
          obras.reduce((a, o) => a + (o.percentual_finalizada ?? 0), 0) /
            obras.length
        )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Clientes
        </Link>
        <span>·</span>
        <span className="mono tabular-nums">{clienteCode(cliente.id_cliente)}</span>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                variant={tipo === "PJ" ? "pj" : "pf"}
                name={cliente.nome}
                size="xl"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CategoryChip tone="neutral">{tipo}</CategoryChip>
                  {cliente.portal_ativo ? (
                    <CategoryChip tone="success">
                      <CheckCircle2 className="size-3" />
                      Portal ativo
                    </CategoryChip>
                  ) : null}
                </div>
                <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
                  {cliente.nome}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                  {cliente.cpf_cnpj ? (
                    <span className="mono tabular-nums">
                      {formatCPFCNPJ(cliente.cpf_cnpj)}
                    </span>
                  ) : null}
                  {cliente.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5" />
                      {cliente.email}
                    </span>
                  ) : null}
                  {cliente.telefone ? (
                    <span className="mono inline-flex items-center gap-1 tabular-nums">
                      <Phone className="size-3.5" />
                      {formatPhone(cliente.telefone)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormOpen(true)}
            >
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      <KpiGrid cols={4}>
        <KpiCard
          label="Total de obras"
          value={obras.length}
          sub={`${obrasConcluidas} concluída${obrasConcluidas === 1 ? "" : "s"}`}
          icon={<Building />}
        />
        <KpiCard
          tone="info"
          label="Obras ativas"
          value={obrasAtivas}
          sub={obrasAtivas > 0 ? "Em execução" : "Sem obra ativa"}
        />
        <KpiCard
          tone={progressoMedio >= 80 ? "success" : "neutral"}
          label="Progresso médio"
          value={`${progressoMedio}%`}
          sub="Sob obras vinculadas"
        />
        <KpiCard
          label="Tipo"
          value={tipo === "PJ" ? "Pessoa jurídica" : "Pessoa física"}
          sub={cliente.cpf_cnpj ? formatCPFCNPJ(cliente.cpf_cnpj) : "Sem documento"}
        />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 py-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-foreground">
                Obras deste cliente
              </h3>
              <span className="text-[12px] text-muted-foreground">
                {obras.length} no histórico
              </span>
            </div>
            {obras.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                Nenhuma obra vinculada ainda.
              </p>
            ) : (
              <div className="space-y-1.5">
                {obras.map((o) => (
                  <button
                    key={o.id_obra}
                    onClick={() => router.push(`/obras/${o.id_obra}`)}
                    className="flex w-full items-center justify-between gap-4 rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-foreground">
                        {o.nome}
                      </div>
                      {o.data_inicio_prevista ? (
                        <div className="text-[11.5px] text-muted-foreground">
                          Início: {formatDate(o.data_inicio_prevista)}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <ProgressBar
                        value={o.percentual_finalizada ?? 0}
                        className="w-24"
                      />
                      <span
                        className={cn(
                          "mono w-10 text-right text-[12px] tabular-nums",
                          (o.percentual_finalizada ?? 0) >= 80
                            ? "text-[var(--success-ink)] font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        {Math.round(o.percentual_finalizada ?? 0)}%
                      </span>
                      <StatusBadge status={o.status} statusMap={OBRA_STATUS} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 py-5">
            <h3 className="text-[15px] font-semibold text-foreground">
              Detalhes
            </h3>
            <dl className="space-y-2.5 text-[13px]">
              {cliente.cpf_cnpj ? (
                <Detail
                  label={tipo === "PJ" ? "CNPJ" : "CPF"}
                  value={formatCPFCNPJ(cliente.cpf_cnpj)}
                  mono
                />
              ) : null}
              {cliente.email ? (
                <Detail label="E-mail" value={cliente.email} />
              ) : null}
              {cliente.telefone ? (
                <Detail
                  label="Telefone"
                  value={formatPhone(cliente.telefone)}
                  mono
                />
              ) : null}
              {cliente.endereco ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Endereço
                  </dt>
                  <dd className="mt-1 inline-flex items-start gap-1 text-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    {cliente.endereco}
                  </dd>
                </div>
              ) : null}
              {cliente.observacoes ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Observações
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {cliente.observacoes}
                  </dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>

      <ClienteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={cliente}
        onSuccess={load}
      />
    </div>
  )
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right text-foreground",
          mono && "mono tabular-nums"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
