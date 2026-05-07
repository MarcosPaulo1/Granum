"use client"

// Port literal de granum-design/dashboard-app.jsx + Dashboard.html
// Layout completo do design preservado; dados de obras vêm da Supabase,
// painéis sem fonte de dados (atenção, semana, fluxo) ficam com placeholders.

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Icon } from "@/components/granum/icon"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"

interface MiniObra {
  id: string
  rawId: number
  nome: string
  resp: string
  pct: number
  status: "ok" | "danger" | "pausa" | "plan"
  atraso?: string | false
  faltam?: string
}

function getInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtBRL(v: number): string {
  if (v >= 1_000_000)
    return "R$ " + (v / 1_000_000).toFixed(2).replace(".", ",") + " mi"
  if (v >= 1000) return "R$ " + Math.round(v / 1000) + " mil"
  return "R$ " + v
}

function ObraDot({ status }: { status: MiniObra["status"] }) {
  const cor =
    status === "danger"
      ? "var(--danger)"
      : status === "pausa"
        ? "var(--warning)"
        : status === "plan"
          ? "var(--planned)"
          : "var(--info)"
  return <span className="dash-status-dot" style={{ background: cor }} />
}

function MiniObraCard({ o }: { o: MiniObra }) {
  let cor = "var(--info)"
  if (o.status === "danger") cor = "var(--danger)"
  else if (o.status === "pausa") cor = "var(--warning)"
  else if (o.status === "plan") cor = "var(--planned)"
  else if (o.pct >= 85) cor = "var(--success)"
  return (
    <Link
      href={`/obras/${o.rawId}`}
      className={"dash-obra" + (o.status === "danger" ? " is-danger" : "")}
    >
      <div className="dash-obra-top">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="dash-obra-name">
            <ObraDot status={o.status} /> {o.nome}
          </div>
          <div className="dash-obra-id">{o.id}</div>
        </div>
        {o.resp ? (
          <span className="avatar-xs" title={o.resp}>
            {getInitials(o.resp)}
          </span>
        ) : null}
      </div>
      <div className="dash-obra-prog">
        <div className="track">
          <div
            className="fill"
            style={{ width: o.pct + "%", background: cor }}
          />
        </div>
        <div className="pct mono">{o.pct}%</div>
      </div>
      <div className="dash-obra-foot">
        {o.status === "danger" && o.atraso ? (
          <span className="danger-tag">
            <Icon name="alertTriangle" />
            {o.atraso}
          </span>
        ) : o.status === "pausa" && o.atraso ? (
          <span style={{ color: "var(--warning-ink)", fontWeight: 500 }}>
            {o.atraso}
          </span>
        ) : o.faltam ? (
          <span>{o.faltam}</span>
        ) : (
          <span>Em andamento</span>
        )}
        <span
          style={{
            color: "var(--primary)",
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          Abrir <Icon name="arrowRight" />
        </span>
      </div>
    </Link>
  )
}

export default function DashboardGeralPage() {
  const { responsavel } = useUser()
  const [obras, setObras] = useState<MiniObra[]>([])
  const [pagar7d, setPagar7d] = useState(0)
  const [boletosPend, setBoletosPend] = useState(0)
  const [, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: obrasRaw } = await supabase
      .from("obra")
      .select("*")
      .neq("status", "cancelada")
      .order("created_at", { ascending: false })

    const respIds = Array.from(
      new Set(
        (obrasRaw ?? [])
          .filter((o) => o.id_responsavel)
          .map((o) => o.id_responsavel!)
      )
    )
    const { data: resps } = respIds.length
      ? await supabase
          .from("responsavel")
          .select("id_responsavel, nome")
          .in("id_responsavel", respIds)
      : { data: [] as { id_responsavel: number; nome: string }[] }
    const respMap = new Map(
      (resps ?? []).map((r) => [r.id_responsavel, r.nome as string])
    )

    const today = new Date()
    setObras(
      (obrasRaw ?? []).slice(0, 6).map((o) => {
        let status: MiniObra["status"] = "ok"
        if (o.status === "pausada") status = "pausa"
        else if (o.status === "planejamento") status = "plan"
        const fim = o.data_fim_prevista
          ? new Date(o.data_fim_prevista)
          : null
        const atrasado =
          fim &&
          fim < today &&
          o.status === "em_andamento"
        if (atrasado) status = "danger"
        const diasFalta = fim
          ? Math.ceil(
              (fim.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0
        return {
          id: `OBR-${String(o.id_obra).padStart(4, "0")}`,
          rawId: o.id_obra,
          nome: o.nome,
          resp: o.id_responsavel
            ? respMap.get(o.id_responsavel) ?? ""
            : "",
          pct: Math.round(o.percentual_finalizada ?? 0),
          status,
          atraso: atrasado
            ? `${Math.abs(diasFalta)} dias atrás no cronograma`
            : status === "pausa"
              ? "Pausada"
              : false,
          faltam:
            !atrasado && status === "ok" && diasFalta > 0 && diasFalta < 30
              ? `${diasFalta} dias p/ entrega`
              : undefined,
        }
      })
    )

    const todayStr = format(today, "yyyy-MM-dd")
    const in7 = new Date()
    in7.setDate(in7.getDate() + 7)
    const in7Str = format(in7, "yyyy-MM-dd")

    const { data: parcelas } = await supabase
      .from("parcela")
      .select("valor, status")
      .neq("status", "pago")
      .lte("data_vencimento", in7Str)
      .gte("data_vencimento", todayStr)

    const totalPagar = (parcelas ?? []).reduce(
      (a, p) => a + Number(p.valor ?? 0),
      0
    )
    setPagar7d(totalPagar)
    setBoletosPend((parcelas ?? []).length)

    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const ativas = obras.filter((o) => o.status === "ok").length
  const atrasadas = obras.filter((o) => o.status === "danger").length
  const pausadas = obras.filter((o) => o.status === "pausa").length
  const greet = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return "Bom dia"
    if (h < 18) return "Boa tarde"
    return "Boa noite"
  }, [])

  const now = new Date()
  const hh = String(now.getHours()).padStart(2, "0")
  const mm = String(now.getMinutes()).padStart(2, "0")
  const dow = format(now, "EEE", { locale: ptBR })
    .toUpperCase()
    .replace(".", "")
  const dom = now.getDate()
  const mes = format(now, "MMM", { locale: ptBR }).replace(".", "")
  const fullDate = format(now, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })

  return (
    <>
      {/* Hero */}
      <div className="dash-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="dash-hero-greet">
            {greet}, {responsavel?.nome?.split(" ")[0] ?? "—"}
          </div>
          <h1>
            Você tem{" "}
            <b>
              {atrasadas} obra{atrasadas !== 1 ? "s" : ""} crítica
              {atrasadas !== 1 ? "s" : ""}
            </b>{" "}
            e{" "}
            <b>
              {pausadas} pausada{pausadas !== 1 ? "s" : ""}
            </b>{" "}
            hoje.
          </h1>
          <div className="dash-hero-sub">
            {atrasadas > 0
              ? "Algumas obras precisam de atenção imediata."
              : "Todas as obras seguem dentro do plano."}{" "}
            Há <b>{fmtBRL(pagar7d)}</b> em pagamentos para os próximos 7 dias.
          </div>
          <div className="dash-hero-actions">
            <Link href="/obras" className="btn btn-primary">
              <Icon name="alertTriangle" />
              Ver obras
            </Link>
            <Link href="/financeiro/contas" className="btn">
              <Icon name="receipt" />
              Contas a pagar
            </Link>
          </div>
        </div>
        <div className="dash-hero-clock">
          <div className="day">
            {dow} · {dom} {mes}
          </div>
          <div className="time">
            {hh}:{mm}
          </div>
          <div className="date">{fullDate}</div>
        </div>
      </div>

      {/* KPIs do portfólio */}
      <div className="list-kpis cols-5" style={{ marginBottom: 18 }}>
        <div className="list-kpi tone-info">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Em andamento</div>
            <div className="kpi-icon">
              <Icon name="construction" />
            </div>
          </div>
          <div className="list-kpi-value">{ativas}</div>
          <div className="list-kpi-sub">
            <Icon name="building" />
            Canteiros ativos
          </div>
        </div>
        <div className="list-kpi tone-danger">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Com atraso</div>
            <div className="kpi-icon">
              <Icon name="alertTriangle" />
            </div>
          </div>
          <div className="list-kpi-value">{atrasadas}</div>
          <div className="list-kpi-sub">
            <Icon name="trendDown" />
            Exigem atenção
          </div>
        </div>
        <div className="list-kpi tone-success">
          <div className="list-kpi-head">
            <div className="list-kpi-label">A receber 7d</div>
            <div className="kpi-icon">
              <Icon name="arrowDown" />
            </div>
          </div>
          <div className="list-kpi-value mono">{fmtBRL(0)}</div>
          <div className="list-kpi-sub">
            <Icon name="check" />
            —
          </div>
        </div>
        <div className="list-kpi tone-warning">
          <div className="list-kpi-head">
            <div className="list-kpi-label">A pagar 7d</div>
            <div className="kpi-icon">
              <Icon name="arrowUp" />
            </div>
          </div>
          <div className="list-kpi-value mono">{fmtBRL(pagar7d)}</div>
          <div className="list-kpi-sub">
            <Icon name="receipt" />
            {boletosPend} boleto{boletosPend !== 1 ? "s" : ""} pendente
            {boletosPend !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="list-kpi">
          <div className="list-kpi-head">
            <div className="list-kpi-label">Saldo de caixa</div>
            <div className="kpi-icon">
              <Icon name="dollar" />
            </div>
          </div>
          <div className="list-kpi-value mono">{fmtBRL(0)}</div>
          <div className="list-kpi-sub">
            <Icon name="activity" />
            Disponível
          </div>
        </div>
      </div>

      {/* Atalhos rápidos */}
      <div className="quick-actions">
        <Link href="/obras" className="quick-action">
          <div className="quick-action-icon">
            <Icon name="fileText" />
          </div>
          <div className="quick-action-text">
            <div className="ttl">Novo diário de obra</div>
            <div className="sub">Registrar o dia</div>
          </div>
        </Link>
        <Link href="/financeiro/lancamentos" className="quick-action">
          <div className="quick-action-icon">
            <Icon name="dollar" />
          </div>
          <div className="quick-action-text">
            <div className="ttl">Lançar despesa</div>
            <div className="sub">NF-e ou boleto</div>
          </div>
        </Link>
        <Link href="/dashboards/alocacao" className="quick-action">
          <div className="quick-action-icon">
            <Icon name="users" />
          </div>
          <div className="quick-action-text">
            <div className="ttl">Escala da semana</div>
            <div className="sub">Alocar trabalhadores</div>
          </div>
        </Link>
        <Link href="/obras" className="quick-action">
          <div className="quick-action-icon">
            <Icon name="plus" />
          </div>
          <div className="quick-action-text">
            <div className="ttl">Nova obra</div>
            <div className="sub">Cadastrar projeto</div>
          </div>
        </Link>
      </div>

      <div className="dash-grid">
        {/* Coluna esquerda */}
        <div className="dash-col-left">
          {/* Esta semana — placeholder */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div>
                <div className="eyebrow">Atenção agora</div>
                <h2>Itens que precisam de você</h2>
              </div>
              <div className="actions">
                <Link href="/obras">
                  Ver tudo <Icon name="arrowRight" />
                </Link>
              </div>
            </div>
            <div className="attn-list">
              {atrasadas === 0 && pausadas === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Tudo certo no portfólio! Nenhuma obra crítica.
                </div>
              ) : (
                obras
                  .filter(
                    (o) => o.status === "danger" || o.status === "pausa"
                  )
                  .map((o) => (
                    <div className="attn-item" key={o.id}>
                      <div
                        className={
                          "attn-icon " +
                          (o.status === "danger" ? "danger" : "warning")
                        }
                      >
                        <Icon
                          name={
                            o.status === "danger"
                              ? "alertTriangle"
                              : "clock"
                          }
                        />
                      </div>
                      <div className="attn-body">
                        <div className="attn-title">
                          {o.nome}
                          {o.status === "danger" ? (
                            <>
                              {" "}
                              está <b>{o.atraso}</b>
                            </>
                          ) : (
                            <> · pausada</>
                          )}
                        </div>
                        <div className="attn-meta">
                          <span>{o.id}</span>
                          {o.resp ? (
                            <>
                              <span style={{ opacity: 0.4 }}>·</span>
                              <span>{o.resp}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="attn-action">
                        <Link
                          href={`/obras/${o.rawId}`}
                          className="btn-mini primary"
                        >
                          Ver obra
                        </Link>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="dash-col-right">
          <div className="dash-card">
            <div className="dash-card-head">
              <div>
                <div className="eyebrow">Portfólio</div>
                <h2>Obras em acompanhamento</h2>
              </div>
              <div className="actions">
                <Link href="/obras">
                  Ver todas <Icon name="arrowRight" />
                </Link>
              </div>
            </div>
            <div className="dash-obras">
              {obras.length === 0 ? (
                <div
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    color: "var(--ink-muted)",
                    fontSize: 13.5,
                  }}
                >
                  Nenhuma obra cadastrada.
                </div>
              ) : (
                obras.map((o) => <MiniObraCard key={o.id} o={o} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
