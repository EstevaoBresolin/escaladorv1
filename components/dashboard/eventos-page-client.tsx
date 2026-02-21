"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, MapPin, MoreVertical } from "lucide-react";
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

interface EventWithMinistries {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
  location: string | null;
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

  // Set initial selected date to today on mount
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

  // Get events for selected date
  const selectedDateEvents = events.filter((e) => e.date === selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
          <p className="text-muted-foreground">
            Gerencie os eventos e escalas da sua igreja
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EventCalendar
            events={events}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {selectedDate
              ? `Eventos de ${new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}`
              : "Selecione um dia"}
          </h2>
          {selectedDateEvents && selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-card-foreground">
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
                        {event.event_ministries &&
                          event.event_ministries.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {event.event_ministries.map(
                                (em: {
                                  ministry_id: string;
                                  ministries: {
                                    id: string;
                                    name: string;
                                    color: string;
                                  };
                                }) => (
                                  <span
                                    key={em.ministry_id}
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
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
                          )}

                        {(isAdmin || ledMinistryIds.length > 0) && (
                          <EventQuickSchedule
                            event={event}
                            isAdmin={isAdmin}
                            ledMinistryIds={ledMinistryIds}
                          />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="mb-4 h-10 w-10 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">
                  Nenhum evento para este dia
                </p>
                {isAdmin && (
                  <Button
                    asChild
                    className="mt-4 bg-transparent"
                    variant="outline"
                    size="sm"
                  >
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
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
