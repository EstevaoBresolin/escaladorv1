import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Edit,
  Users,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { VolunteerSlotManager } from "@/components/dashboard/volunteer-slot-manager";
import { EventQuickSchedule } from "@/components/dashboard/event-quick-schedule";
import { ReplicateEventButton } from "@/components/dashboard/replicate-event-button";
import {
  getUserPermissionsByProfile,
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
    .select("church_id, role")
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

  const permissions = user
    ? await getUserPermissionsByProfile(supabase, user.id, profile?.role)
    : null;
  const isAdmin = permissions?.isAdmin || false;

  const canManageEvent =
    isAdmin ||
    permissions?.ledMinistryIds.some((ledMinistryId) =>
      event.event_ministries?.some(
        (eventMinistry: { ministry_id: string }) =>
          eventMinistry.ministry_id === ledMinistryId,
      ),
    ) ||
    false;

  const eventMinistryIds =
    event.event_ministries?.map(
      (eventMinistry: { ministry_id: string }) => eventMinistry.ministry_id,
    ) || [];

  const { data: allMinistries } = await supabase
    .from("ministries")
    .select("id, name, color")
    .eq("church_id", profile?.church_id)
    .order("name");

  const manageableMinistries = permissions
    ? getManageableMinistries(
        eventMinistryIds,
        permissions,
        allMinistries || [],
      )
    : [];

  const volunteers = permissions
    ? await getAssignableVolunteers(supabase, eventMinistryIds, permissions)
    : [];

  const { data: unavailableVolunteers } = await supabase
    .from("volunteer_unavailability")
    .select("user_id, unavailable_date, period")
    .eq("unavailable_date", event.date);

  const confirmedSlots =
    event.volunteer_slots?.filter(
      (slot: { status: string }) => slot.status === "confirmed",
    ).length || 0;
  const pendingSlots =
    event.volunteer_slots?.filter(
      (slot: { status: string }) => slot.status === "pending",
    ).length || 0;

  const eventDateLabel = new Date(event.date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              Detalhes do evento
            </div>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {event.title}
            </h1>
            <p className="mt-2 text-sm capitalize text-muted-foreground">
              {eventDateLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/eventos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/eventos/${id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
            {canManageEvent && (
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
            )}
            {/* Botão Replicar Evento só para quem NÃO é admin nem líder */}
            {isAdmin && (
              <ReplicateEventButton
                eventId={event.id}
                title={event.title}
                description={event.description}
                location={event.location}
                churchId={event.church_id}
                data={event.date}
                ministryIds={(event.event_ministries || []).map(
                  (em: { ministry_id: string }) => em.ministry_id,
                )}
                hasSchedules={(event.volunteer_slots || []).length > 0}
              />
            )}
          </div>
        </div>

        {(previousEvent || nextEvent) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!previousEvent}
              asChild={!!previousEvent}
            >
              {previousEvent ? (
                <Link href={`/dashboard/eventos/${previousEvent.id}`}>
                  Evento anterior
                </Link>
              ) : (
                <span>Evento anterior</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!nextEvent}
              asChild={!!nextEvent}
            >
              {nextEvent ? (
                <Link href={`/dashboard/eventos/${nextEvent.id}`}>
                  Próximo evento
                </Link>
              ) : (
                <span>Próximo evento</span>
              )}
            </Button>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Confirmados</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-card-foreground">
              {confirmedSlots}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-card-foreground">
              {pendingSlots}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ministérios</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-card-foreground">
              {event.event_ministries?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Escalas totais</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-card-foreground">
              {event.volunteer_slots?.length || 0}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm font-medium text-card-foreground capitalize">
                    {eventDateLabel}
                  </p>
                </div>
              </div>

              {event.start_time && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Horário</p>
                    <p className="text-sm font-medium text-card-foreground">
                      {event.start_time.slice(0, 5)}
                    </p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="break-words text-sm font-medium text-card-foreground">
                      {event.location}
                    </p>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="mt-1 text-sm text-card-foreground">
                    {event.description}
                  </p>
                </div>
              )}

              {event.event_ministries?.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Ministérios envolvidos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {event.event_ministries.map(
                      (eventMinistry: {
                        ministry_id: string;
                        ministries: { id: string; name: string; color: string };
                      }) => (
                        <span
                          key={eventMinistry.ministry_id}
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${eventMinistry.ministries.color}20`,
                            color: eventMinistry.ministries.color,
                          }}
                        >
                          {eventMinistry.ministries.name}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Escala de Voluntários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VolunteerSlotManager
                eventId={event.id}
                eventDate={event.date}
                eventStartTime={event.start_time}
                slots={event.volunteer_slots || []}
                volunteers={
                  volunteers.map((volunteer) => ({
                    id: volunteer.id,
                    name: volunteer.name,
                    email: volunteer.email,
                  })) || []
                }
                ministries={manageableMinistries || []}
                unavailableData={unavailableVolunteers || []}
                canManage={canManageEvent}
                isAdmin={isAdmin}
                ledMinistryIds={permissions?.ledMinistryIds || []}
                memberMinistryIds={
                  userMinistries?.map(
                    (userMinistry) => userMinistry.ministry_id,
                  ) || []
                }
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
