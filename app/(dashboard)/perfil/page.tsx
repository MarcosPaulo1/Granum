"use client"

// Port literal de granum-design/perfil-app.jsx + Perfil.html

import { useState } from "react"

import { Icon } from "@/components/granum/icon"
import { ROLES } from "@/lib/constants"
import { useUser } from "@/lib/hooks/use-user"
import { formatDate } from "@/lib/utils/format"

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Field({
  label,
  value,
  type = "text",
  cols = 1,
}: {
  label: string
  value: string
  type?: string
  cols?: 1 | 2
}) {
  return (
    <div className="field" style={{ gridColumn: `span ${cols}` }}>
      <label className="field-label">{label}</label>
      <input
        className="input"
        type={type}
        defaultValue={value}
        readOnly
      />
    </div>
  )
}

export default function PerfilPage() {
  const { user, responsavel, role, isLoading } = useUser()
  const [tab, setTab] = useState<"dados" | "seg" | "atividade" | "prefs">(
    "dados"
  )

  if (isLoading) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Carregando perfil…
      </div>
    )
  }

  if (!user) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--ink-muted)",
        }}
      >
        Não autenticado.
      </div>
    )
  }

  const nome = responsavel?.nome ?? user.email ?? "Usuário"
  const email = responsavel?.email ?? user.email ?? "—"
  const cargo = responsavel?.cargo ?? "—"
  const telefone = responsavel?.telefone ?? "—"
  const whatsapp = responsavel?.telefone_whatsapp ?? telefone
  const departamento = responsavel?.departamento ?? "—"
  const dataAdmissao = responsavel?.data_admissao
    ? formatDate(responsavel.data_admissao)
    : "—"
  const roleLabel = role ? (ROLES as Record<string, string>)[role] ?? role : "—"

  return (
    <>
      <div className="profile-hero">
        <div className="profile-avatar">{getInitials(nome)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="obra-id">
            {roleLabel}
            {role === "diretor" ? " · acesso total" : ""}
          </div>
          <h1 style={{ margin: "2px 0 4px" }}>{nome}</h1>
          <div className="profile-meta">
            <span>
              <Icon name="mail" />
              {email}
            </span>
            {telefone && telefone !== "—" ? (
              <span>
                <Icon name="phone" />
                {telefone}
              </span>
            ) : null}
            <span>
              <Icon name="briefcase" />
              {cargo}
            </span>
            {responsavel?.data_admissao ? (
              <span>
                <Icon name="calendar" />
                Membro desde {dataAdmissao}
              </span>
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexShrink: 0,
            alignSelf: "flex-start",
          }}
        >
          <button className="btn btn-ghost btn-sm" disabled>
            <Icon name="logout" />
            Sair
          </button>
          <button className="btn btn-primary btn-sm" disabled>
            <Icon name="edit" />
            Editar perfil
          </button>
        </div>
      </div>

      <div
        className="list-kpis"
        style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <div className="list-kpi">
          <div className="list-kpi-label">Cargo</div>
          <div
            className="list-kpi-value"
            style={{ fontSize: 16, fontWeight: 500 }}
          >
            {cargo}
          </div>
          <div className="list-kpi-sub">
            <Icon name="briefcase" />
            {departamento}
          </div>
        </div>
        <div className="list-kpi tone-info">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Perfil de acesso</div>
            <div className="kpi-icon">
              <Icon name="shield" />
            </div>
          </div>
          <div
            className="list-kpi-value"
            style={{ fontSize: 16, fontWeight: 500 }}
          >
            {roleLabel}
          </div>
          <div className="list-kpi-sub">
            <Icon name="check" />
            Permissões aplicadas
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">E-mail</div>
          <div
            className="list-kpi-value"
            style={{ fontSize: 14, fontWeight: 500, wordBreak: "break-all" }}
          >
            {email}
          </div>
          <div className="list-kpi-sub">
            <Icon name="check" />
            {user.email_confirmed_at ? "Confirmado" : "Não confirmado"}
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-label">Admissão</div>
          <div className="list-kpi-value mono">{dataAdmissao}</div>
          <div className="list-kpi-sub">
            <Icon name="calendar" />
            Data de entrada
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 18 }}>
        {(
          [
            { id: "dados", label: "Dados pessoais", icon: "user" },
            { id: "seg", label: "Segurança", icon: "shield" },
            { id: "atividade", label: "Atividade", icon: "activity" },
            { id: "prefs", label: "Preferências", icon: "settings" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            className={"tab" + (tab === t.id ? " active" : "")}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        {tab === "dados" ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 18,
            }}
          >
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
                    Identificação
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    Dados pessoais
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <Field label="Nome completo" value={nome} cols={2} />
                  <Field label="E-mail" value={email} type="email" cols={2} />
                  <Field label="Telefone" value={telefone} type="tel" />
                  <Field label="WhatsApp" value={whatsapp} type="tel" />
                  <Field label="Cargo" value={cargo} cols={2} />
                  <Field label="Departamento" value={departamento} />
                  <Field label="Admissão" value={dataAdmissao} />
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
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
                      Foto
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Avatar</div>
                  </div>
                </div>
                <div
                  className="card-body"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    className="profile-avatar"
                    style={{ width: 120, height: 120, fontSize: 42 }}
                  >
                    {getInitials(nome)}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled
                    >
                      <Icon name="upload" />
                      Enviar foto
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
            </div>
          </div>
        ) : null}

        {tab === "seg" ? (
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
                  Autenticação
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  Senha e sessões
                </div>
              </div>
            </div>
            <div className="card-body">
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-muted)",
                  marginBottom: 12,
                }}
              >
                Gerenciamento de senha e sessões em desenvolvimento.
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled
              >
                <Icon name="key" />
                Alterar senha
              </button>
            </div>
          </div>
        ) : null}

        {tab === "atividade" ? (
          <div className="card">
            <div
              className="card-body"
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--ink-muted)",
              }}
            >
              <Icon name="activity" />
              <div style={{ marginTop: 12, fontSize: 13 }}>
                Timeline de atividade em desenvolvimento.
              </div>
            </div>
          </div>
        ) : null}

        {tab === "prefs" ? (
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
                  Aparência
                </div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  Tema e idioma
                </div>
              </div>
            </div>
            <div className="card-body">
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-muted)",
                  marginBottom: 16,
                }}
              >
                Idioma: Português (Brasil) · Fuso: America/Sao_Paulo (UTC−3)
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled
                >
                  Claro
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled
                >
                  Escuro
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled
                >
                  Auto
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
