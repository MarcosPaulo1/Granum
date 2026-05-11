"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { TarefasTab } from "@/components/obra-tabs/tarefas-tab"
import { Icon } from "@/components/granum/icon"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"

export default function TarefasPage() {
  const params = useParams()
  const { role } = useUser()
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
              {" · Tarefas"}
            </div>
            <h1>Tarefas da obra</h1>
            <div className="subtitle">
              Cronograma de execução em Gantt ou lista detalhada
            </div>
          </div>
        </div>
      </div>
      <TarefasTab obraId={obraId} role={role} />
    </>
  )
}
