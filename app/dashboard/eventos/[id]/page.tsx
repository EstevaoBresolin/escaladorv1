import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, MapPin, Edit, Users } from "lucide-react";
import Link from "next/link";
import { VolunteerSlotManager } from "@/components/dashboard/volunteer-slot-manager";
import { EventQuickSchedule } from "@/components/dashboard/event-quick-schedule";
import {
  getUserPermissions,
  getAssignableVolunteers,
  getManageableMinistries,
} from "@/lib/permissions";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      `
      *,
      event_ministries(
        ministry_id,
        ministries(id, name, color)
      ),
      volunteer_slots(
        id,
        status,
        profiles(id, name, email),
        ministries(id, name, color),
        ministry_functions(id, name)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", user?.id)
    .single();

  const { data: userMinistries } = user?.id
    ? await supabase
        .from("user_ministries")
        .select("ministry_id")
        .eq("user_id", user.id)
    : { data: [] };

  const currentStartTime = event.start_time ?? "00:00:00";

  const { data: nextEvent } = profile?.church_id
    ? await supabase
        .from("events")
        .select("id, title, date, start_time")
        .eq("church_id", profile.church_id)
        .or(
          `date.gt.${event.date},and(date.eq.${event.date},start_time.gt.${currentStartTime})`,
        )
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: previousEvent } = profile?.church_id
    ? await supabase
        .from("events")
        .select("id, title, date, start_time")
        .eq("church_id", profile.church_id)
        .or(
          `date.lt.${event.date},and(date.eq.${event.date},start_time.lt.${currentStartTime})`,
        )
        .order("date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  // Get user permissions
  const permissions = await getUserPermissions(supabase);
  const isAdmin = permissions?.isAdmin || false;
  const canManageEvent =
    isAdmin ||
    permissions?.ledMinistryIds.some((lid) =>
      event.event_ministries?.some(
        (em: { ministry_id: string }) => em.ministry_id === lid,
      ),
    ) ||
    false;

  // Get ministry IDs from the event
  const eventMinistryIds =
    event.event_ministries?.map(
      (em: { ministry_id: string }) => em.ministry_id,
    ) || [];

  // Get all ministries for the church
  const { data: allMinistries } = await supabase
    .from("ministries")
    .select("id, name, color")
    .eq("church_id", profile?.church_id)
    .order("name");

  // Get manageable ministries based on permissions
  const manageableMinistries = permissions
    ? getManageableMinistries(
        eventMinistryIds,
        permissions,
        allMinistries || [],
      )
    : [];

  // Get assignable volunteers based on permissions
  const volunteers = permissions
    ? await getAssignableVolunteers(supabase, eventMinistryIds, permissions)
    : [];

  // Get unavailable volunteers for this event date with period information
  const { data: unavailableVolunteers } = await supabase
    .from("volunteer_unavailability")
    .select("user_id, unavailable_date, period")
    .eq("unavailable_date", event.date);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/eventos">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-foreground">
              {event.title}
            </h1>
            <p className="text-muted-foreground">Detalhes do evento</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          {(previousEvent || nextEvent) && (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
              <Button
                variant="outline"
                size="sm"
                disabled={!previousEvent}
                asChild={!!previousEvent}
              >
                {previousEvent ? (
                  <Link href={`/dashboard/eventos/${previousEvent.id}`}>
                    <span className="sm:hidden">Anterior</span>
                    <span className="hidden sm:inline">Evento anterior</span>
                  </Link>
                ) : (
                  <span>
                    <span className="sm:hidden">Anterior</span>
                    <span className="hidden sm:inline">Evento anterior</span>
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!nextEvent}
                asChild={!!nextEvent}
              >
                {nextEvent ? (
                  <Link href={`/dashboard/eventos/${nextEvent.id}`}>
                    <span className="sm:hidden">Próximo</span>
                    <span className="hidden sm:inline">Próximo evento</span>
                  </Link>
                ) : (
                  <span>
                    <span className="sm:hidden">Próximo</span>
                    <span className="hidden sm:inline">Próximo evento</span>
                  </span>
                )}
              </Button>
            </div>
          )}
          {isAdmin && (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/eventos/${id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium text-card-foreground">
                    {new Date(event.date + "T12:00:00").toLocaleDateString(
                      "pt-BR",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>

              {event.start_time && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium text-card-foreground">
                      {event.start_time.slice(0, 5)}
                    </p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="break-words font-medium text-card-foreground">
                      {event.location}
                    </p>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="mt-1 break-words text-card-foreground">
                    {event.description}
                  </p>
                </div>
              )}

              {event.event_ministries && event.event_ministries.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Ministérios Envolvidos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {event.event_ministries.map(
                      (em: {
                        ministry_id: string;
                        ministries: { id: string; name: string; color: string };
                      }) => (
                        <span
                          key={em.ministry_id}
                          className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
                          style={{
                            backgroundColor: `${em.ministries.color}20`,
                            color: em.ministries.color,
                          }}
                        >
                          {em.ministries.name}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Escala de Voluntários
              </CardTitle>
              <EventQuickSchedule
                event={{
                  id: event.id,
                  title: event.title,
                  date: event.date,
                  start_time: event.start_time,
                  event_ministries: event.event_ministries || [],
                }}
                isAdmin={isAdmin}
                ledMinistryIds={permissions?.ledMinistryIds || []}
              />
            </CardHeader>
            <CardContent>
              <VolunteerSlotManager
                eventId={event.id}
                eventDate={event.date}
                eventStartTime={event.start_time}
                slots={event.volunteer_slots || []}
                volunteers={
                  volunteers.map((v) => ({
                    id: v.id,
                    name: v.name,
                    email: v.email,
                  })) || []
                }
                ministries={manageableMinistries || []}
                unavailableData={unavailableVolunteers || []}
                canManage={canManageEvent}
                isAdmin={isAdmin}
                ledMinistryIds={permissions?.ledMinistryIds || []}
                memberMinistryIds={
                  userMinistries?.map((um) => um.ministry_id) || []
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Voluntários escalados
                </span>
                <span className="font-semibold text-card-foreground">
                  {event.volunteer_slots?.filter(
                    (s: { status: string }) => s.status === "confirmed",
                  ).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pendentes</span>
                <span className="font-semibold text-card-foreground">
                  {event.volunteer_slots?.filter(
                    (s: { status: string }) => s.status === "pending",
                  ).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ministérios</span>
                <span className="font-semibold text-card-foreground">
                  {event.event_ministries?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
