"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { LoadingCard } from "@/components/ui/spinner";
import {
  DashboardEmptyState,
  DashboardErrorAlert,
} from "@/components/dashboard/dashboard-feedback";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string | null;
  location: string | null;
}

interface Ministry {
  id: string;
  name: string;
  color: string;
}

export default function EditarEventoPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [start_time, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    async function loadEvent() {
      const { data: eventData } = await supabase
        .from("events")
        .select("*, event_ministries(ministry_id)")
        .eq("id", eventId)
        .single();

      if (!eventData) {
        setError("Evento não encontrado.");
        setLoading(false);
        return;
      }

      setEvent(eventData);
      setTitle(eventData.title);
      setDescription(eventData.description || "");
      setDate(eventData.date);
      setStartTime(eventData.start_time || "");
      setLocation(eventData.location || "");

      const ministryIds =
        eventData.event_ministries?.map(
          (eventMinistry: { ministry_id: string }) => eventMinistry.ministry_id,
        ) || [];
      setSelectedMinistries(ministryIds);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("id", user.id)
          .single();

        if (profile?.church_id) {
          const { data: ministriesData } = await supabase
            .from("ministries")
            .select("id, name, color")
            .eq("church_id", profile.church_id)
            .order("name");

          if (ministriesData) setMinistries(ministriesData);
        }
      }

      setLoading(false);
    }

    loadEvent();
  }, [eventId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("events")
      .update({
        title,
        description: description || null,
        date,
        start_time: start_time || null,
        location: location || null,
      })
      .eq("id", eventId);

    if (updateError) {
      setError("Erro ao atualizar evento. Tente novamente.");
      setSaving(false);
      return;
    }

    await supabase.from("event_ministries").delete().eq("event_id", eventId);

    if (selectedMinistries.length > 0) {
      const eventMinistries = selectedMinistries.map((ministryId) => ({
        event_id: eventId,
        ministry_id: ministryId,
      }));
      await supabase.from("event_ministries").insert(eventMinistries);
    }

    router.push(`/dashboard/eventos/${eventId}`);
  }

  function toggleMinistry(ministryId: string) {
    setSelectedMinistries((prev) =>
      prev.includes(ministryId)
        ? prev.filter((id) => id !== ministryId)
        : [...prev, ministryId],
    );
  }

  function handleBackNavigation() {
    if (navigatingBack) return;
    setNavigatingBack(true);
    router.push(`/dashboard/eventos/${eventId}`);
  }

  if (loading) {
    return <LoadingCard message="Carregando evento..." />;
  }

  if (!event) {
    return (
      <DashboardEmptyState
        icon={ArrowLeft}
        title="Evento não encontrado"
        description="Este evento não está disponível ou foi removido."
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/eventos">Voltar para eventos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">
              Atualização de cadastro
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Editar Evento
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Atualize informações e ministérios para manter o planejamento
              consistente.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleBackNavigation}
            disabled={navigatingBack}
          >
            {navigatingBack ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeft className="mr-2 h-4 w-4" />
            )}
            Voltar
          </Button>
        </div>
      </section>

      <Card className="max-w-3xl rounded-2xl">
        <CardHeader>
          <CardTitle>Informações do evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <DashboardErrorAlert message={error} />}

            <div className="space-y-2">
              <Label htmlFor="title">Nome do evento *</Label>
              <Input
                id="title"
                placeholder="Ex: Culto de Domingo, Ensaio do Louvor..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Horário</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={start_time}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                placeholder="Ex: Templo Principal, Salão de Festas..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Adicione detalhes sobre o evento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {ministries.length > 0 && (
              <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
                <Label>Ministérios envolvidos</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ministries.map((ministry) => (
                    <div
                      key={ministry.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={ministry.id}
                        checked={selectedMinistries.includes(ministry.id)}
                        onCheckedChange={() => toggleMinistry(ministry.id)}
                      />
                      <label
                        htmlFor={ministry.id}
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: ministry.color }}
                        />
                        {ministry.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/eventos/${eventId}`}>Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
