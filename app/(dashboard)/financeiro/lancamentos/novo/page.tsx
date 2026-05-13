"use client"

// /financeiro/lancamentos/novo — LancamentoNovo.html como rota dedicada

import { useRouter } from "next/navigation"

import { LancamentoForm } from "@/components/forms/lancamento-form"
import { Icon } from "@/components/granum/icon"

export default function NovoLancamentoPage() {
  const router = useRouter()

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Financeiro · Lançamentos</div>
            <h1>Novo lançamento</h1>
            <div className="subtitle">
              Registre uma entrada ou saída financeira. O lançamento aparecerá
              em Lançamentos, no painel financeiro da obra e no fluxo de caixa.
            </div>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "var(--ink-muted)",
            fontSize: 13.5,
          }}
        >
          <Icon name="dollar" />
          <div
            style={{
              marginTop: 10,
              fontSize: 15,
              color: "var(--ink)",
              fontWeight: 500,
            }}
          >
            Formulário aberto no modal acima
          </div>
          <div style={{ marginTop: 4 }}>
            Cancele ou salve o lançamento para voltar à listagem.
          </div>
        </div>
      </div>

      <LancamentoForm
        open={true}
        onOpenChange={(o) => {
          if (!o) router.push("/financeiro/lancamentos")
        }}
        onSuccess={() => router.push("/financeiro/lancamentos")}
      />
    </>
  )
}
