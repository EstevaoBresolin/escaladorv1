"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Ministry } from "@/lib/types";
import { DashboardErrorAlert } from "@/components/dashboard/dashboard-feedback";

export default function NovoVoluntarioPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
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
      setChurchId(profile.church_id);

      const { data } = await supabase
        .from("ministries")
        .select("*")
        .eq("church_id", profile.church_id)
        .order("name");

      if (data) setMinistries(data);
    }

    loadData();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!churchId) {
      setError("Igreja não encontrada.");
      setLoading(false);
      return;
    }

    // Create a new profile for the volunteer
    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: crypto.randomUUID(),
        church_id: churchId,
        name: fullName,
        email: email || null,
        phone: phone || null,
        role: "volunteer",
      })
      .select()
      .single();

    if (profileError || !newProfile) {
      setError("Erro ao criar voluntário. Tente novamente.");
      setLoading(false);
      return;
    }

    if (selectedMinistries.length > 0) {
      const userMinistries = selectedMinistries.map((ministryId) => ({
        user_id: newProfile.id,
        ministry_id: ministryId,
      }));

      await supabase.from("user_ministries").insert(userMinistries);
    }

    router.push("/dashboard/voluntarios");
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
          <Link href="/dashboard/voluntarios">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Novo Voluntário
          </h1>
          <p className="text-muted-foreground">
            Adicione um novo voluntário à sua igreja
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Voluntário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <DashboardErrorAlert message={error} />}

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Nome do voluntário"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {ministries.length > 0 && (
              <div className="space-y-3">
                <Label>Ministérios</Label>
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
                    Adicionando...
                  </>
                ) : (
                  "Adicionar Voluntário"
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
