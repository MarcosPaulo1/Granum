"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Role } from "@/lib/constants"
import type { Database } from "@/lib/supabase/types"

type Responsavel = Database["public"]["Tables"]["responsavel"]["Row"]

interface UseUserReturn {
  user: User | null
  responsavel: Responsavel | null
  role: Role | null
  isLoading: boolean
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [responsavel, setResponsavel] = useState<Responsavel | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          setIsLoading(false)
          return
        }

        setUser(authUser)

        // Buscar responsavel e perfil com RPC ou query direta
        const { data: respData } = await supabase.rpc("get_user_role")
        const { data: respIdData } = await supabase.rpc("get_user_responsavel_id")

        if (respData) {
          setRole(respData as Role)
        }

        if (respIdData) {
          const { data: resp } = await supabase
            .from("responsavel")
            .select("*")
            .eq("id_responsavel", respIdData as number)
            .single()

          if (resp) {
            setResponsavel(resp as Responsavel)
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null)
          setResponsavel(null)
          setRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, responsavel, role, isLoading }
}
