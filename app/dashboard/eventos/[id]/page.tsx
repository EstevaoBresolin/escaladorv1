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
  Plus,
} from "lucide-react";
import Link from "next/link";
import { VolunteerSlotManager } from "@/components/dashboard/volunteer-slot-manager";

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
        ministries(id, name, color)
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

  const { data: volunteers } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("church_id", profile?.church_id)
    .order("name");

  const { data: ministries } = await supabase
    .from("ministries")
    .select("id, name, color")
    .eq("church_id", profile?.church_id)
    .order("name");

  // Get unavailable volunteers for this event date
  const { data: unavailableVolunteers } = await supabase
    .from("volunteer_unavailability")
    .select("user_id")
    .eq("date", event.date);

  const unavailableIds = unavailableVolunteers?.map((u) => u.user_id) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/eventos">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {event.title}
            </h1>
            <p className="text-muted-foreground">Detalhes do evento</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/eventos/${id}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
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
                    {new Date(event.date).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
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
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="font-medium text-card-foreground">
                      {event.location}
                    </p>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="mt-1 text-card-foreground">
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
                slots={event.volunteer_slots || []}
                volunteers={volunteers || []}
                ministries={ministries || []}
                unavailableIds={unavailableIds}
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
