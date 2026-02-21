"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Loader2, SunMoon, ChevronRight } from "lucide-react";
import type { Profile } from "@/lib/types";

interface DashboardTopbarProps {
  profile: (Profile & { churches: { name: string } | null }) | null;
}

export function DashboardTopbar({ profile }: DashboardTopbarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const selectedTheme = theme ?? "system";

  const routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    ministerios: "Ministérios",
    voluntarios: "Voluntários",
    eventos: "Eventos",
    escalas: "Escalas",
    perfil: "Meu Perfil",
    configuracoes: "Configurações",
    disponibilidade: "Disponibilidade",
    notificacoes: "Notificações",
  };

  const currentSegment = pathname.split("/").filter(Boolean)[1];
  const currentPageLabel = currentSegment
    ? routeLabels[currentSegment] || "Página"
    : "Dashboard";

  const todayLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 pl-12 lg:pl-0">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <span>Painel</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate">{currentPageLabel}</span>
          </div>
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            Olá, {profile?.name?.split(" ")[0] || "Usuário"}
          </h1>
          <p className="truncate text-xs text-muted-foreground capitalize">
            {todayLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 gap-2 px-3 text-muted-foreground hover:text-foreground"
                aria-label="Alterar tema"
              >
                <SunMoon className="h-5 w-5" />
                <span className="hidden text-sm sm:inline">Tema</span>
                <span className="sr-only">Alterar tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Tema</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={selectedTheme}
                onValueChange={(value) => setTheme(value)}
              >
                <DropdownMenuRadioItem value="light">
                  Claro
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  Escuro
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  Sistema
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-full border border-transparent pl-2 pr-3 hover:border-border"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {initials}
                </div>
                <span className="hidden text-sm font-medium text-foreground md:inline">
                  {profile?.name || "Usuário"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">
                  {profile?.name || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.churches?.name || "Minha Igreja"}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/perfil")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
