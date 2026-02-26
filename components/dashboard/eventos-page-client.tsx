"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventCalendar } from "@/components/dashboard/event-calendar";
import { DeleteEventButton } from "@/components/dashboard/delete-event-button";
import { EventQuickSchedule } from "@/components/dashboard/event-quick-schedule";
import { ReplicateEventButton } from "@/components/dashboard/replicate-event-button";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-feedback";

interface EventWithMinistries {
  id: string;
  church_id: string;
  title: string;
  description?: string | null;
  date: string;
  start_time: string | null;
  location: string | null;
  has_schedules: boolean;
  event_ministries: Array<{
    ministry_id: string;
    ministries: { id: string; name: string; color: string };
  }>;
}

interface EventsPageClientProps {
  events: EventWithMinistries[];
  isAdmin: boolean;
  ledMinistryIds: string[];
}

export function EventsPageClient({
  events,
  isAdmin,
  ledMinistryIds,
}: EventsPageClientProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const paramDate = searchParams.get("date");
    if (paramDate) {
      setSelectedDate(paramDate);
      return;
    }

    setSelectedDate((current) => {
      if (current) return current;
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    });
  }, [searchParams]);

  const selectedDateEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate),
    [events, selectedDate],
  );

  const currentMonthEventsCount = useMemo(() => {
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return events.filter((event) => event.date.startsWith(`${monthKey}-`))
      .length;
  }, [events]);

  const upcomingCount = events.filter((event) => {
    const today = new Date();
    const eventDate = new Date(`${event.date}T12:00:00`);
    return (
      eventDate >=
      new Date(today.getFullYear(), today.getMonth(), today.getDate())
    );
  }).length;

  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Selecione um dia";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              Planejamento de agenda
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Eventos
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Organize cultos, encontros e escalas em uma visão única de
              calendário.
            </p>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link
                href={
                  selectedDate
                    ? `/dashboard/eventos/novo?date=${selectedDate}`
                    : "/dashboard/eventos/novo"
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Eventos no mês
              </p>
              <span className="rounded-lg bg-primary/15 p-2 text-primary">
                <CalendarDays className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
              {currentMonthEventsCount}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Próximos eventos
              </p>
              <span className="rounded-lg bg-chart-2/15 p-2 text-chart-2">
                <BadgeCheck className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
              {upcomingCount}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Eventos no dia
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
              {selectedDateEvents.length}
            </p>
            <p className="mt-2 text-xs capitalize text-muted-foreground">
              {selectedDateLabel}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Calendário</CardTitle>
            {isAdmin && (
              <Button asChild size="sm" className="ml-2">
                <Link
                  href={
                    selectedDate
                      ? `/dashboard/eventos/novo?date=${selectedDate}`
                      : "/dashboard/eventos/novo"
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Novo Evento
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <EventCalendar
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="capitalize">{selectedDateLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-border/70 bg-background/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium text-card-foreground">
                          {event.title}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {new Date(
                                event.date + "T12:00:00",
                              ).toLocaleDateString("pt-BR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                          {event.start_time && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{event.start_time.slice(0, 5)}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>

                        {event.event_ministries.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {event.event_ministries.map((eventMinistry) => (
                              <span
                                key={eventMinistry.ministry_id}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: `${eventMinistry.ministries.color}20`,
                                  color: eventMinistry.ministries.color,
                                }}
                              >
                                {eventMinistry.ministries.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {(isAdmin || ledMinistryIds.length > 0) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <EventQuickSchedule
                              event={event}
                              isAdmin={isAdmin}
                              ledMinistryIds={ledMinistryIds}
                              triggerSize="sm"
                            />
                            <ReplicateEventButton
                              eventId={event.id}
                              title={event.title}
                              description={event.description || null}
                              location={event.location || null}
                              churchId={event.church_id}
                              ministryIds={event.event_ministries.map(
                                (em) => em.ministry_id,
                              )}
                              hasSchedules={event.has_schedules}
                              triggerSize="sm"
                            />
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/eventos/${event.id}`}>
                              Ver detalhes
                            </Link>
                          </DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/eventos/${event.id}/editar`}
                                >
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DeleteEventButton
                                eventId={event.id}
                                eventName={event.title}
                              />
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState
                icon={Calendar}
                title="Nenhum evento para este dia"
                description="Selecione outra data ou crie um novo evento para começar a agenda."
                action={
                  isAdmin ? (
                    <Button asChild size="sm">
                      <Link
                        href={
                          selectedDate
                            ? `/dashboard/eventos/novo?date=${selectedDate}`
                            : "/dashboard/eventos/novo"
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Evento
                      </Link>
                    </Button>
                  ) : null
                }
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
