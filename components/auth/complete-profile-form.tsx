"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { normalizeBrazilianPhone } from "@/lib/phone";

interface Church {
  id: string;
  name: string;
}

interface CompleteProfileFormProps {
  initialPhone?: string;
  initialChurchId?: string;
}

export function CompleteProfileForm({
  initialPhone = "",
  initialChurchId = "",
}: CompleteProfileFormProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [churchId, setChurchId] = useState(initialChurchId);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingChurches, setLoadingChurches] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadChurches() {
      setLoadingChurches(true);
      const { data, error } = await supabase
        .from("churches")
        .select("id, name")
        .order("name");

      if (error) {
        setError("Erro ao carregar igrejas");
      } else {
        setChurches(data || []);
      }
      setLoadingChurches(false);
    }

    loadChurches();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate inputs
    const normalizedPhone = normalizeBrazilianPhone(phone);
    if (normalizedPhone.error || !normalizedPhone.value) {
      setError(normalizedPhone.error || "Número de telefone inválido");
      return;
    }

    if (!churchId) {
      setError("Selecione uma igreja");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não encontrado");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        phone: normalizedPhone.value,
        church_id: churchId,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(
        updateError.message || "Erro ao atualizar perfil. Tente novamente.",
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="phone">Número de Telefone *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Seu número será usado para contato sobre os eventos
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="church">Selecione sua Igreja *</Label>
        {loadingChurches ? (
          <div className="flex items-center justify-center rounded-md border border-input bg-background p-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Carregando igrejas...
            </span>
          </div>
        ) : churches.length === 0 ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            Nenhuma igreja encontrada. Contate o administrador.
          </div>
        ) : (
          <Select value={churchId} onValueChange={setChurchId}>
            <SelectTrigger id="church" className="h-11">
              <SelectValue placeholder="Escolha sua igreja" />
            </SelectTrigger>
            <SelectContent>
              {churches.map((church) => (
                <SelectItem key={church.id} value={church.id}>
                  {church.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || loadingChurches || churches.length === 0}
        className="w-full h-11"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Continuar para o Dashboard"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Você pode editar essas informações depois em{" "}
        <span className="font-medium">Configurações</span>
      </p>
    </form>
  );
}
