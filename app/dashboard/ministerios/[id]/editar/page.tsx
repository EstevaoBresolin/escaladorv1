"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { LoadingCard } from "@/components/ui/spinner";

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

  if (loading) {
    return <LoadingCard message="Carregando ministério..." />;
  }

  if (!ministry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/ministerios">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Ministério não encontrado
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ministerios">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Editar Ministério
          </h1>
          <p className="text-muted-foreground">
            Atualize as informações do ministério
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Ministério</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Ministério *</Label>
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
                rows={3}
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
                <Link href="/dashboard/ministerios">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
