"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Ministry } from "@/lib/types";

export default function NovoEventoPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadMinistries() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      if (!profile?.church_id) return;

      const { data } = await supabase
        .from("ministries")
        .select("*")
        .eq("church_id", profile.church_id)
        .order("name");

      if (data) setMinistries(data);
    }

    loadMinistries();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Você precisa estar logado.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("church_id")
      .eq("id", user.id)
      .single();

    if (!profile?.church_id) {
      setError("Igreja não encontrada.");
      setLoading(false);
      return;
    }

    const { data: event, error: insertError } = await supabase
      .from("events")
      .insert({
        church_id: profile.church_id,
        title: name,
        description: description || null,
        date,
        start_time: time || "00:00:00",
        location: location || null,
      })
      .select()
      .single();

    if (insertError || !event) {
      setError("Erro ao criar evento. Tente novamente.");
      setLoading(false);
      return;
    }

    if (selectedMinistries.length > 0) {
      const eventMinistries = selectedMinistries.map((ministryId) => ({
        event_id: event.id,
        ministry_id: ministryId,
      }));

      await supabase.from("event_ministries").insert(eventMinistries);
    }

    router.push("/dashboard/eventos");
    router.refresh();
  }

  function toggleMinistry(ministryId: string) {
    setSelectedMinistries((prev) =>
      prev.includes(ministryId)
        ? prev.filter((id) => id !== ministryId)
        : [...prev, ministryId],
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/eventos">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Evento</h1>
          <p className="text-muted-foreground">
            Crie um novo evento para sua igreja
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
              <Label htmlFor="name">Nome do Evento *</Label>
              <Input
                id="name"
                placeholder="Ex: Culto de Domingo, Ensaio do Louvor..."
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
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
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Evento"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/eventos">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
