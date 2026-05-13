"use client"

// /obras/nova — ObraNova.html como rota dedicada
// O design mostra o form como modal sobre /obras. Mantemos o ObraForm
// (Dialog) sempre aberto e redirecionamos para /obras ao fechar.

import { useRouter } from "next/navigation"

import { ObraForm } from "@/components/forms/obra-form"
import { Icon } from "@/components/granum/icon"

export default function NovaObraPage() {
  const router = useRouter()

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">Obras</div>
            <h1>Nova obra</h1>
            <div className="subtitle">
              Cadastre uma nova obra associando-a a cliente, responsável e
              centro de custo. A obra será criada com status{" "}
              <strong>Planejamento</strong>.
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
          <Icon name="building" />
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
            Cancele ou crie a obra para voltar à listagem.
          </div>
        </div>
      </div>

      <ObraForm
        open={true}
        onOpenChange={(o) => {
          if (!o) router.push("/obras")
        }}
        onSuccess={() => router.push("/obras")}
      />
    </>
  )
}
