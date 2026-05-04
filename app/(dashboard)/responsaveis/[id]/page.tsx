"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Briefcase,
  Building,
  CalendarDays,
  ClipboardList,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react"

import { ResponsavelForm } from "@/components/forms/responsavel-form"
import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { OBRA_STATUS, ROLES, TAREFA_STATUS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import type { Database } from "@/lib/supabase/types"

type Responsavel = Database["public"]["Tables"]["responsavel"]["Row"]

const PERFIL_TONE: Record<
  string,
  "primary" | "info" | "success" | "warning" | "neutral"
> = {
  diretor: "primary",
  arquiteta: "info",
  engenheiro: "success",
  mestre_obra: "warning",
  financeiro: "neutral",
}

function responsavelCode(id: number) {
  return `RSP-${String(id).padStart(3, "0")}`
}

export default function ResponsavelPerfilPage() {
  const params = useParams()
  const router = useRouter()
  const [responsavel, setResponsavel] = useState<Responsavel | null>(null)
  const [perfilCodigo, setPerfilCodigo] = useState<string>("")
  const [obras, setObras] = useState<
    { id_obra: number; nome: string; status: string }[]
  >([])
  const [tarefas, setTarefas] = useState<
    { id_tarefa: number; nome: string; status: string }[]
  >([])
  const [formOpen, setFormOpen] = useState(false)

  async function load() {
    const supabase = createClient()
    const id = Number(params.id)

    const { data: r } = await supabase
      .from("responsavel")
      .select("*")
      .eq("id_responsavel", id)
      .single()
    setResponsavel(r as Responsavel | null)

    if (r) {
      const { data: p } = await supabase
        .from("perfil")
        .select("nome")
        .eq("id_perfil", r.id_perfil)
        .single()
      setPerfilCodigo((p as { nome: string } | null)?.nome ?? "")
    }

    const { data: o } = await supabase
      .from("obra")
      .select("id_obra, nome, status")
      .eq("id_responsavel", id)
    setObras(
      (o ?? []) as { id_obra: number; nome: string; status: string }[]
    )

    const { data: t } = await supabase
      .from("tarefa")
      .select("id_tarefa, nome, status")
      .eq("id_responsavel", id)
      .order("created_at", { ascending: false })
      .limit(20)
    setTarefas(
      (t ?? []) as { id_tarefa: number; nome: string; status: string }[]
    )
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (!responsavel) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Carregando responsável…
      </div>
    )
  }

  const perfilLabel =
    (ROLES as Record<string, string>)[perfilCodigo] ?? perfilCodigo
  const tone = PERFIL_TONE[perfilCodigo] ?? "neutral"
  const tarefasAtivas = tarefas.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelada"
  ).length
  const obrasAtivas = obras.filter((o) =>
    ["em_andamento", "planejamento"].includes(o.status)
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link
          href="/responsaveis"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Responsáveis
        </Link>
        <span>·</span>
        <span className="mono tabular-nums">
          {responsavelCode(responsavel.id_responsavel)}
        </span>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar variant="pf" name={responsavel.nome} size="xl" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CategoryChip tone={tone}>
                    {perfilLabel || "Sem perfil"}
                  </CategoryChip>
                  {responsavel.ativo === false ? (
                    <CategoryChip tone="neutral">Inativo</CategoryChip>
                  ) : (
                    <CategoryChip tone="success">Ativo</CategoryChip>
                  )}
                </div>
                <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-foreground">
                  {responsavel.nome}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                  {responsavel.cargo ? (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="size-3.5" />
                      {responsavel.cargo}
                    </span>
                  ) : null}
                  {responsavel.departamento ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {responsavel.departamento}
                    </span>
                  ) : null}
                  {responsavel.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5" />
                      {responsavel.email}
                    </span>
                  ) : null}
                  {responsavel.telefone ? (
                    <span className="mono inline-flex items-center gap-1 tabular-nums">
                      <Phone className="size-3.5" />
                      {responsavel.telefone}
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
          tone={tone}
          label="Perfil"
          value={perfilLabel || "—"}
          sub="Permissão atual"
          icon={<User />}
        />
        <KpiCard
          tone="info"
          label="Obras vinculadas"
          value={obras.length}
          sub={`${obrasAtivas} ativa${obrasAtivas === 1 ? "" : "s"}`}
          icon={<Building />}
        />
        <KpiCard
          label="Tarefas"
          value={tarefas.length}
          sub={`${tarefasAtivas} em aberto`}
          icon={<ClipboardList />}
        />
        <KpiCard
          label="Admissão"
          value={
            responsavel.data_admissao
              ? formatDate(responsavel.data_admissao)
              : "—"
          }
          sub="Data de entrada"
          icon={<CalendarDays />}
        />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 py-5">
            <h3 className="text-[15px] font-semibold text-foreground">
              Obras atribuídas
            </h3>
            {obras.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                Nenhuma obra atribuída.
              </p>
            ) : (
              <div className="space-y-1.5">
                {obras.map((o) => (
                  <button
                    key={o.id_obra}
                    onClick={() => router.push(`/obras/${o.id_obra}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
                  >
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {o.nome}
                    </span>
                    <StatusBadge status={o.status} statusMap={OBRA_STATUS} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-5">
            <h3 className="text-[15px] font-semibold text-foreground">
              Tarefas recentes
            </h3>
            {tarefas.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                Nenhuma tarefa atribuída.
              </p>
            ) : (
              <div className="space-y-1.5">
                {tarefas.slice(0, 8).map((t) => (
                  <div
                    key={t.id_tarefa}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/30"
                    )}
                  >
                    <span className="truncate text-[13px] text-foreground">
                      {t.nome}
                    </span>
                    <StatusBadge
                      status={t.status}
                      statusMap={TAREFA_STATUS}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ResponsavelForm
        open={formOpen}
        onOpenChange={setFormOpen}
        responsavel={responsavel}
        onSuccess={load}
      />
    </div>
  )
}
