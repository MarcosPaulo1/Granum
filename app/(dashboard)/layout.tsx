"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ROLES } from "@/lib/constants"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, responsavel, role, isLoading } = useUser()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const userName = responsavel?.nome ?? user.email ?? "Usuário"
  const roleName = role ? ROLES[role] : "Sem perfil"

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar
          role={role}
          userName={userName}
          roleName={roleName}
          onSignOut={handleSignOut}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          role={role}
          userName={userName}
          roleName={roleName}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
