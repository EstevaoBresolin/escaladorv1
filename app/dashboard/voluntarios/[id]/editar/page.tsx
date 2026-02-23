"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { LoadingCard } from "@/components/ui/spinner";
import { normalizeBrazilianPhone } from "@/lib/phone";
import {
  DashboardEmptyState,
  DashboardErrorAlert,
} from "@/components/dashboard/dashboard-feedback";

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

export default function EditarVoluntarioPage() {
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const router = useRouter();
  const params = useParams();
  const volunteerId = params.id as string;
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadVolunteer() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

      const isAdmin = currentProfile?.role === "admin";
      const isOwnProfile = user?.id === volunteerId;

      if (!isAdmin && !isOwnProfile) {
        setError("Você não tem permissão para editar este perfil.");
        setLoading(false);
        return;
      }

      setCanEdit(true);

      const { data: volunteerData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", volunteerId)
        .single();

      if (!volunteerData) {
        setError("Voluntário não encontrado.");
        setLoading(false);
        return;
      }

      setVolunteer(volunteerData);
      setName(volunteerData.name);
      setEmail(volunteerData.email);
      setPhone(volunteerData.phone || "");
      setLoading(false);
    }

    loadVolunteer();
  }, [volunteerId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    let normalizedPhone: string | null = null;
    if (phone.trim()) {
      const result = normalizeBrazilianPhone(phone);
      if (result.error || !result.value) {
        setError(result.error || "Número de telefone inválido");
        setSaving(false);
        return;
      }
      normalizedPhone = result.value;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name,
        email,
        phone: normalizedPhone,
      })
      .eq("id", volunteerId);

    if (updateError) {
      setError("Erro ao atualizar voluntário. Tente novamente.");
      setSaving(false);
      return;
    }

    router.push("/dashboard/voluntarios");
  }

  function handleBackNavigation() {
    if (navigatingBack) return;
    setNavigatingBack(true);
    router.push("/dashboard/voluntarios");
  }

  if (loading) {
    return <LoadingCard message="Carregando voluntário..." />;
  }

  if (!canEdit || !volunteer) {
    return (
      <DashboardEmptyState
        icon={ArrowLeft}
        title={error ? "Acesso indisponível" : "Voluntário não encontrado"}
        description={
          error || "Este perfil não está disponível ou foi removido."
        }
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/voluntarios">Voltar para voluntários</Link>
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
              Editar Voluntário
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Atualize dados de contato e identificação do voluntário.
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
          <CardTitle>Informações do voluntário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <DashboardErrorAlert message={error} />}

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

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
                <Link href="/dashboard/voluntarios">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
