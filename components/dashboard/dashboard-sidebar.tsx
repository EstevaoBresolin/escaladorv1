"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Church,
  Building2,
  UserCircle,
  Menu,
  X,
  CalendarOff,
  CalendarClock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Profile } from "@/lib/types";

interface DashboardSidebarProps {
  profile: (Profile & { churches: { name: string } | null }) | null;
  canViewVolunteers?: boolean;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ministérios", href: "/dashboard/ministerios", icon: Church },
  { label: "Voluntários", href: "/dashboard/voluntarios", icon: Users },
  { label: "Eventos", href: "/dashboard/eventos", icon: Calendar },
  { label: "Escalas", href: "/dashboard/escalas", icon: CalendarClock },
];

const accountItems = [
  {
    label: "Disponibilidade",
    href: "/dashboard/disponibilidade",
    icon: CalendarOff,
  },
  { label: "Meu Perfil", href: "/dashboard/perfil", icon: UserCircle },
  { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
];

export function DashboardSidebar({
  profile,
  canViewVolunteers = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isVolunteerOnly = profile?.role === "volunteer";
  const isMemberOnly = profile?.role === "member";
  const isSuperAdmin = profile?.role === "superadmin";

  const visibleNavItems = isSuperAdmin
    ? [
        { label: "Superadmin", href: "/dashboard/superadmin", icon: Shield },
        {
          label: "Gestão Global",
          href: "/dashboard/superadmin/igrejas",
          icon: Building2,
        },
      ]
    : isMemberOnly
      ? []
      : isVolunteerOnly
        ? canViewVolunteers
          ? navItems
          : navItems.filter((item) => item.label !== "Voluntários")
        : navItems;

  const visibleAccountItems = isMemberOnly
    ? accountItems.filter(
        (item) => item.label === "Meu Perfil" || item.label === "Configurações",
      )
    : accountItems;

  const roleLabel =
    profile?.role === "superadmin"
      ? "Superadmin"
      : profile?.role === "admin"
        ? "Administrador"
        : profile?.role === "leader"
          ? "Líder"
          : profile?.role === "volunteer"
            ? "Voluntário"
            : "Membro";

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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border/80 bg-sidebar/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="space-y-4 border-b border-sidebar-border/80 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm">
              <Image
                src="/icon-dark-32x32.png"
                alt="GoMinistry"
                width={40}
                height={40}
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-semibold text-sidebar-foreground">
                GoMinistry
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {profile?.churches?.name ||
                  (isSuperAdmin ? "Controle global" : "Minha Igreja")}
              </span>
            </div>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-sidebar-border bg-sidebar-accent/60 px-2.5 py-1 text-[11px] font-medium text-sidebar-accent-foreground">
            {roleLabel}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-6 space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Principal
            </p>
            {visibleNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-primary-foreground/20"
                        : "bg-sidebar-accent/60 group-hover:bg-sidebar-accent",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Conta
            </p>
            {visibleAccountItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-primary-foreground/20"
                        : "bg-sidebar-accent/60 group-hover:bg-sidebar-accent",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t border-sidebar-border/80 p-4">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
            <p className="text-xs font-medium text-sidebar-foreground">
              Planejamento semanal
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mantenha a disponibilidade atualizada para escalar melhor.
            </p>
            <Link
              href="/dashboard/disponibilidade"
              onClick={() => setMobileOpen(false)}
              className="mt-3 inline-flex text-xs font-medium text-sidebar-primary hover:underline"
            >
              Atualizar disponibilidade
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
