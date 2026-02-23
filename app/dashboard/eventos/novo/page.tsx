"use client";

import React, { useEffect, useState } from "react";
import React from "react";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { DashboardErrorAlert } from "@/components/dashboard/dashboard-feedback";

export default function NovoEventoPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const prefillDate = searchParams.get("date");
    if (prefillDate && !date) {
      setDate(prefillDate);
    }

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
  }, [supabase, searchParams, date]);

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

    router.push(
      date
        ? `/dashboard/eventos?date=${encodeURIComponent(date)}`
        : "/dashboard/eventos",
    );
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
    router.push("/dashboard/eventos");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Novo cadastro</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Novo Evento
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie o evento e defina os ministérios envolvidos para facilitar a
              escala.
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
              <Label htmlFor="name">Nome do evento *</Label>
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
