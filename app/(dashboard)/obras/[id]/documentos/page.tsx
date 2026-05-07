"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { DocumentosTab } from "@/components/obra-tabs/documentos-tab"
import { PageHeader } from "@/components/shared/page-header"
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
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Link
          href={`/obras/${obraId}`}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          {obraNome || "Obra"}
        </Link>
      </div>

      <PageHeader
        eyebrow="Obra · Documentação"
        title="Documentos"
        subtitle={obraNome}
      />

      <DocumentosTab obraId={obraId} />
    </div>
  )
}
