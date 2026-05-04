"use client"

import { useState } from "react"
import {
  Activity,
  Briefcase,
  CalendarDays,
  Languages,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Phone,
  Smartphone,
  User,
} from "lucide-react"

import { Avatar } from "@/components/shared/avatar"
import { CategoryChip } from "@/components/shared/category-chip"
import { KpiCard, KpiGrid } from "@/components/shared/kpi-card"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ROLES } from "@/lib/constants"
import { useUser } from "@/lib/hooks/use-user"
import { formatDate } from "@/lib/utils/format"

export default function PerfilPage() {
  const { user, responsavel, role, isLoading } = useUser()
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light")

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Carregando perfil…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Usuário não autenticado.
      </div>
    )
  }

  const nome = responsavel?.nome ?? user.email ?? "Usuário"
  const cargo = responsavel?.cargo ?? "—"
  const departamento = responsavel?.departamento ?? "—"
  const email = responsavel?.email ?? user.email ?? "—"
  const telefone = responsavel?.telefone ?? null
  const admissao = responsavel?.data_admissao ?? null
  const roleLabel = role ? (ROLES as Record<string, string>)[role] ?? role : "—"

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Conta · Sistema"
        title="Meu perfil"
        subtitle="Informações pessoais, segurança e preferências"
      />

      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                variant="user"
                name={nome}
                size="xl"
                className="shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
                  {nome}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="size-3.5" />
                    {cargo}
                  </span>
                  {departamento !== "—" ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {departamento}
                    </span>
                  ) : null}
                  <CategoryChip tone="primary">{roleLabel}</CategoryChip>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Editar perfil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <KpiGrid cols={4}>
        <KpiCard
          label="Cargo"
          value={cargo}
          sub={departamento !== "—" ? departamento : "Sem departamento"}
          icon={<Briefcase />}
        />
        <KpiCard
          tone="primary"
          label="Perfil de acesso"
          value={roleLabel}
          sub="Permissões aplicadas"
          icon={<User />}
        />
        <KpiCard
          tone="info"
          label="E-mail"
          value={
            <span className="text-[16px] font-normal break-all">{email}</span>
          }
          sub={user.email_confirmed_at ? "Confirmado" : "Não confirmado"}
          icon={<Mail />}
        />
        <KpiCard
          label="Admissão"
          value={admissao ? formatDate(admissao) : "—"}
          sub="Data de entrada"
          icon={<CalendarDays />}
        />
      </KpiGrid>

      <Tabs defaultValue="dados">
        <TabsList className="w-full justify-start overflow-x-auto rounded-md border border-border bg-card p-1">
          <TabsTrigger value="dados">Dados pessoais</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="atividade">Atividade</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardContent className="py-5">
              <h3 className="mb-4 text-[15px] font-semibold text-foreground">
                Informações pessoais
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo" value={nome} icon={User} />
                <Field label="E-mail" value={email} icon={Mail} />
                <Field
                  label="Telefone"
                  value={telefone ?? "—"}
                  icon={Phone}
                />
                <Field label="Cargo" value={cargo} icon={Briefcase} />
                <Field
                  label="Departamento"
                  value={departamento}
                  icon={MapPin}
                />
                <Field
                  label="Data de admissão"
                  value={admissao ? formatDate(admissao) : "—"}
                  icon={CalendarDays}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-[15px] font-semibold text-foreground">
                    Senha
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground">
                    Última atualização não disponível
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Lock data-icon="inline-start" />
                  Alterar senha
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 py-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Sessões ativas
              </h3>
              <div className="space-y-2">
                <SessionRow
                  Icon={Monitor}
                  device="Navegador atual"
                  meta="Sessão atual · Você está aqui"
                  active
                />
                <SessionRow
                  Icon={Smartphone}
                  device="Mobile (não configurado)"
                  meta="Quando o app móvel estiver disponível"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atividade" className="space-y-4">
          <Card>
            <CardContent className="py-8 text-center">
              <Activity className="mx-auto size-8 text-muted-foreground/60" />
              <p className="mt-3 text-[13px] text-muted-foreground">
                Timeline de atividade aparece quando o sistema começar a registrar.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 py-5">
              <h3 className="text-[15px] font-semibold text-foreground">
                Aparência
              </h3>
              <div>
                <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tema
                </Label>
                <div className="flex gap-2">
                  {(["light", "dark", "auto"] as const).map((t) => (
                    <Button
                      key={t}
                      variant={theme === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(t)}
                      disabled
                    >
                      {t === "light" ? "Claro" : t === "dark" ? "Escuro" : "Auto"}
                    </Button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Modo escuro implementado em fase futura.
                </p>
              </div>
              <div>
                <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Idioma
                </Label>
                <div className="flex items-center gap-2">
                  <Languages className="size-4 text-muted-foreground" />
                  <span className="text-[13px] text-foreground">
                    Português (Brasil)
                  </span>
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fuso horário
                </Label>
                <span className="text-[13px] text-foreground">
                  America/Sao_Paulo (UTC−3)
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}

function Field({ label, value, icon: Icon }: FieldProps) {
  return (
    <div>
      <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
        <Icon className="size-4 text-muted-foreground" />
        <Input
          value={value}
          readOnly
          className="h-auto border-0 bg-transparent p-0 text-[13px] text-foreground"
        />
      </div>
    </div>
  )
}

interface SessionRowProps {
  Icon: React.ComponentType<{ className?: string }>
  device: string
  meta: string
  active?: boolean
}

function SessionRow({ Icon, device, meta, active }: SessionRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <div className="text-[13px] font-medium text-foreground">{device}</div>
          <div className="text-[11.5px] text-muted-foreground">{meta}</div>
        </div>
      </div>
      {active ? (
        <CategoryChip tone="success">
          <span className="size-1.5 rounded-full bg-[var(--success)]" />
          Ativa
        </CategoryChip>
      ) : null}
    </div>
  )
}
