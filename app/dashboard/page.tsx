import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Church,
  Users,
  Calendar,
  Bell,
  Plus,
  ArrowRight,
  Clock3,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import {
  getCachedPermissions,
  getCachedProfile,
  getCachedUser,
} from "@/lib/supabase/cache";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    return null;
  }

  const profile = await getCachedProfile(user.id);
  const permissions = await getCachedPermissions(user.id);
  const isAdmin = permissions?.isAdmin || false;

  const [ministriesResult, volunteersResult, eventsResult] = await Promise.all([
    supabase
      .from("ministries")
      .select("id", { count: "exact" })
      .eq("church_id", profile?.church_id),
    supabase
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("church_id", profile?.church_id),
    supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("church_id", profile?.church_id)
      .gte("date", new Date().toISOString().split("T")[0]),
  ]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*, event_ministries(ministry_id, ministries(name, color))")
    .eq("church_id", profile?.church_id)
    .gte("date", todayStr)
    .order("date", { ascending: true })
    .limit(6);

  const stats = [
    {
      title: "Ministérios ativos",
      value: ministriesResult.count || 0,
      subtitle: "Estruturas cadastradas na igreja",
      icon: Church,
      href: "/dashboard/ministerios",
      iconClass: "bg-primary/15 text-primary",
    },
    {
      title: "Voluntários",
      value: volunteersResult.count || 0,
      subtitle: "Pessoas disponíveis para escala",
      icon: Users,
      href: "/dashboard/voluntarios",
      iconClass: "bg-chart-1/15 text-chart-1",
    },
    {
      title: "Eventos futuros",
      value: eventsResult.count || 0,
      subtitle: "Agenda confirmada para próximos dias",
      icon: Calendar,
      href: "/dashboard/eventos",
      iconClass: "bg-chart-2/15 text-chart-2",
    },
    {
      title: "Notificações",
      value: 0,
      subtitle: "Lembretes e comunicados pendentes",
      icon: Bell,
      href: "/dashboard/notificacoes",
      iconClass: "bg-chart-3/15 text-chart-3",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              Visão operacional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Dashboard da igreja
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe indicadores, próximos eventos e ações importantes em um
              único lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button asChild>
                <Link href="/dashboard/eventos/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Evento
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard/escalas">Ver escalas</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
                    {stat.value}
                  </p>
                </div>
                <span className={`rounded-xl p-2.5 ${stat.iconClass}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {stat.subtitle}
              </p>
              <Link
                href={stat.href}
                className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                Abrir módulo
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximos eventos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/eventos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-border/70 bg-background/70 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium text-card-foreground">
                          {event.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground capitalize">
                          {new Date(
                            event.date + "T12:00:00",
                          ).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>

                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/eventos/${event.id}`}>
                          Detalhes
                        </Link>
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {(event.start_time || event.time) && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {(event.start_time || event.time).slice(0, 5)}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location || "Local não informado"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/70 p-8 text-center">
                <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  Nenhum evento programado no momento.
                </p>
                {isAdmin && (
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/eventos/novo">
                      <Plus className="mr-2 h-4 w-4" />
                      Criar primeiro evento
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/dashboard/ministerios">
                Gerenciar ministérios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/dashboard/voluntarios">
                Gerenciar voluntários
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/dashboard/disponibilidade">
                Atualizar disponibilidade
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              asChild
            >
              <Link href="/dashboard/escalas">
                Consultar escalas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
