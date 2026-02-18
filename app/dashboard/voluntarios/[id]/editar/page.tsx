"use client";

import React, { useState, useEffect } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const router = useRouter();
  const params = useParams();
  const volunteerId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    async function loadVolunteer() {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get current user's profile to check if admin
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

  if (loading) {
    return <LoadingCard message="Carregando voluntário..." />;
  }

  if (!canEdit || !volunteer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/voluntarios">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {error || "Voluntário não encontrado"}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/voluntarios">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Editar Voluntário
          </h1>
          <p className="text-muted-foreground">
            Atualize as informações do voluntário
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Voluntário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

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
                <Link href="/dashboard/voluntarios">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
