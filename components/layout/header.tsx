"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { DynamicBreadcrumb } from "./breadcrumb"
import { NotificationsBell } from "@/components/shared/notifications-bell"
import type { Role } from "@/lib/constants"

interface HeaderProps {
  role: Role | null
  userName: string
  roleName: string
  onSignOut: () => void
}

export function Header({ role, userName, roleName, onSignOut }: HeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="lg:hidden" />}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar
            role={role}
            userName={userName}
            roleName={roleName}
            onSignOut={onSignOut}
          />
        </SheetContent>
      </Sheet>

      <DynamicBreadcrumb />

      <div className="ml-auto">
        <NotificationsBell />
      </div>
    </header>
  )
}
