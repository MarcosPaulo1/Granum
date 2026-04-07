"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Obra {
  id_obra: number
  nome: string
}

interface ObraSelectorProps {
  value?: number
  onValueChange: (value: number) => void
  placeholder?: string
  className?: string
}

export function ObraSelector({
  value,
  onValueChange,
  placeholder = "Selecione a obra",
  className,
}: ObraSelectorProps) {
  const [obras, setObras] = useState<Obra[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadObras() {
      const supabase = createClient()
      const { data } = await supabase
        .from("obra")
        .select("id_obra, nome")
        .order("nome")

      setObras(data ?? [])
      setIsLoading(false)
    }

    loadObras()
  }, [])

  return (
    <Select
      value={value?.toString()}
      onValueChange={(v) => v && onValueChange(Number(v))}
      disabled={isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? "Carregando..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {obras.map((obra) => (
          <SelectItem key={obra.id_obra} value={obra.id_obra.toString()}>
            {obra.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
