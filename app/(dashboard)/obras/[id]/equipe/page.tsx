"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { EquipeTab } from "@/components/obra-tabs/equipe-tab"
import { Icon } from "@/components/granum/icon"
import { createClient } from "@/lib/supabase/client"

export default function EquipePage() {
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
              {" · Equipe"}
            </div>
            <h1>Escala da equipe</h1>
            <div className="subtitle">
              Alocação semanal dos trabalhadores na obra
            </div>
          </div>
        </div>
      </div>
      <EquipeTab obraId={obraId} />
    </>
  )
}
