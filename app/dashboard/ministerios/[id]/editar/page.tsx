"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { LoadingCard } from "@/components/ui/spinner";
import {
  DashboardEmptyState,
  DashboardErrorAlert,
} from "@/components/dashboard/dashboard-feedback";

interface Ministry {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

export default function EditarMinisterioPage() {
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const ministryId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    async function loadMinistry() {
      const { data: ministryData } = await supabase
        .from("ministries")
        .select("*")
        .eq("id", ministryId)
        .single();

      if (!ministryData) {
        setError("Ministério não encontrado.");
        setLoading(false);
        return;
      }

      setMinistry(ministryData);
      setName(ministryData.name);
      setDescription(ministryData.description || "");
      setColor(ministryData.color || "#3B82F6");
      setLoading(false);
    }

    loadMinistry();
  }, [ministryId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("ministries")
      .update({
        name,
        description: description || null,
        color,
      })
      .eq("id", ministryId);

    if (updateError) {
      setError("Erro ao atualizar ministério. Tente novamente.");
      setSaving(false);
      return;
    }

    router.push("/dashboard/ministerios");
  }

  function handleBackNavigation() {
    if (navigatingBack) return;
    setNavigatingBack(true);
    router.push("/dashboard/ministerios");
  }

  if (loading) {
    return <LoadingCard message="Carregando ministério..." />;
  }

  if (!ministry) {
    return (
      <DashboardEmptyState
        icon={ArrowLeft}
        title="Ministério não encontrado"
        description="Este ministério não está disponível ou foi removido."
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/ministerios">Voltar para ministérios</Link>
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
              Editar Ministério
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajuste nome, cor e descrição para manter o módulo organizado.
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
          <CardTitle>Informações do ministério</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <DashboardErrorAlert message={error} />}

            <div className="space-y-2">
              <Label htmlFor="name">Nome do ministério *</Label>
              <Input
                id="name"
                placeholder="Ex: Louvor, Diaconia, Infantil..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-3">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o ministério..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
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
                <Link href="/dashboard/ministerios">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
