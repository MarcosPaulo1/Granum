"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { DocumentosTab } from "@/components/obra-tabs/documentos-tab"
import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

export default function DocumentosPage() {
  const params = useParams()
  const obraId = Number(params.id)
  const [obraNome, setObraNome] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("obra")
      .select("nome")
      .eq("id_obra", obraId)
      .single()
      .then(({ data }) => {
        if (data) setObraNome((data as { nome: string }).nome)
      })
  }, [obraId])

  return (
    <>
      <div className="page-head">
        <div className="page-head-top">
          <div className="page-head-title">
            <div className="obra-id">
              <Link
                href={`/obras/${obraId}`}
                style={{ color: "inherit", display: "inline-flex", gap: 4, alignItems: "center" }}
              >
                <Icon name="chevronLeft" style={{ width: 12, height: 12 }} />
                {obraNome || "Obra"}
              </Link>
              {" · Documentos"}
            </div>
            <h1>Documentos</h1>
            <div className="subtitle">
              Projetos, fotos, contratos e arquivos da obra
            </div>
          </div>
        </div>
      </div>
      <DocumentosTab obraId={obraId} />
    </>
  )
}
