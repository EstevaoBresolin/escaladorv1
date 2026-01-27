"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarCheck,
  LayoutDashboard,
  Users,
  Calendar,
  Bell,
  Settings,
  Church,
  UserCircle,
  Menu,
  X,
  CalendarOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { Profile } from "@/lib/types"

interface DashboardSidebarProps {
  profile: (Profile & { churches: { name: string } | null }) | null
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Ministérios",
    href: "/dashboard/ministerios",
    icon: Church,
  },
  {
    label: "Voluntários",
    href: "/dashboard/voluntarios",
    icon: Users,
  },
  {
    label: "Eventos",
    href: "/dashboard/eventos",
    icon: Calendar,
  },
  {
    label: "Notificações",
    href: "/dashboard/notificacoes",
    icon: Bell,
  },
]

const bottomNavItems = [
  {
    label: "Disponibilidade",
    href: "/dashboard/disponibilidade",
    icon: CalendarOff,
  },
  {
    label: "Meu Perfil",
    href: "/dashboard/perfil",
    icon: UserCircle,
  },
  {
    label: "Configurações",
    href: "/dashboard/configuracoes",
    icon: Settings,
  },
]

export function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Fechar menu"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <CalendarCheck className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              Conecte Escalas
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {profile?.churches?.name || "Minha Igreja"}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
