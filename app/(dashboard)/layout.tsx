"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@/lib/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { Sidebar, Header } from "@/components/granum/chrome"
import { ROLES } from "@/lib/constants"
import { Icon } from "@/components/granum/icon"

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
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name="refresh"
          className="animate-spin"
          style={{ width: 28, height: 28, color: "var(--primary)" }}
        />
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
    <div className="app">
      <Sidebar role={role} userName={userName} roleName={roleName} />
      <div className="main">
        <Header onSignOut={handleSignOut} />
        <div className="content">{children}</div>
      </div>
    </div>
  )
}
