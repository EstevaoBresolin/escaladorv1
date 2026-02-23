"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { DashboardErrorAlert } from "@/components/dashboard/dashboard-feedback";

const colors = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
];

export default function NovoMinisterioPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [loading, setLoading] = useState(false);
  const [navigatingBack, setNavigatingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

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

    const { error: insertError } = await supabase.from("ministries").insert({
      church_id: profile.church_id,
      name,
      description: description || null,
      color,
    });

    if (insertError) {
      setError("Erro ao criar ministério. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/ministerios");
  }

  function handleBackNavigation() {
    if (navigatingBack) return;
    setNavigatingBack(true);
    router.push("/dashboard/ministerios");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Novo cadastro</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Novo Ministério
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie um ministério com identidade visual própria para facilitar a
              gestão.
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
                placeholder="Ex: Louvor, Recepção, Infantil..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva as atividades e responsabilidades do ministério..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-background/60 p-4">
              <Label>Cor de identificação</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      color === colorOption
                        ? "ring-2 ring-foreground ring-offset-2"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: colorOption }}
                    aria-label={`Selecionar cor ${colorOption}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Ministério"
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
