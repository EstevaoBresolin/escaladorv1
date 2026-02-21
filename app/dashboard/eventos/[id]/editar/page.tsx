"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

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

      // Set selected ministries
      const ministryIds =
        eventData.event_ministries?.map(
          (em: { ministry_id: string }) => em.ministry_id,
        ) || [];
      setSelectedMinistries(ministryIds);

      // Load all ministries from the church
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

    // Update ministries - first delete existing, then insert new ones
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

  if (loading) {
    return <LoadingCard message="Carregando evento..." />;
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/eventos">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Evento não encontrado
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/eventos/${eventId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Evento</h1>
          <p className="text-muted-foreground">
            Atualize as informações do evento
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Nome do Evento *</Label>
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
                rows={3}
              />
            </div>

            {ministries.length > 0 && (
              <div className="space-y-3">
                <Label>Ministérios Envolvidos</Label>
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
                        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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

            <div className="flex gap-3">
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
