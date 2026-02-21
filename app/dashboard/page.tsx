import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Church, Users, Calendar, Bell, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getUserPermissionsByProfile } from "@/lib/permissions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, role")
    .eq("id", user?.id)
    .single();

  // Get user permissions
  const permissions = user
    ? await getUserPermissionsByProfile(supabase, user.id, profile?.role)
    : null;
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

  const stats = [
    {
      label: "Ministérios",
      value: ministriesResult.count || 0,
      icon: Church,
      href: "/dashboard/ministerios",
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Voluntários",
      value: volunteersResult.count || 0,
      icon: Users,
      href: "/dashboard/voluntarios",
      color: "bg-accent/20 text-accent",
    },
    {
      label: "Eventos Futuros",
      value: eventsResult.count || 0,
      icon: Calendar,
      href: "/dashboard/eventos",
      color: "bg-chart-2/20 text-chart-2",
    },
    {
      label: "Notificações",
      value: 0,
      icon: Bell,
      href: "/dashboard/notificacoes",
      color: "bg-chart-3/20 text-chart-3",
    },
  ];

  // Get today's date in local timezone (not UTC)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*, event_ministries(ministry_id, ministries(name))")
    .eq("church_id", profile?.church_id)
    .gte("date", todayStr)
    .order("date", { ascending: true })
    .limit(5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua igreja</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/eventos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                {stat.value}
              </div>
              <Link
                href={stat.href}
                className="mt-1 inline-flex items-center text-sm text-primary hover:underline"
              >
                Ver todos
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Próximos Eventos</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/eventos">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-card-foreground">
                      {event.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        },
                      )}
                      {event.time && ` às ${event.time.slice(0, 5)}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/eventos/${event.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum evento programado</p>
              {isAdmin && (
                <Button
                  asChild
                  className="mt-4 bg-transparent"
                  variant="outline"
                >
                  <Link href="/dashboard/eventos/novo">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Evento
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
