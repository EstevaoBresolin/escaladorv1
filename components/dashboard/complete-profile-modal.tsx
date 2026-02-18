"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface CompleteProfileModalProps {
  isOpen: boolean;
  userPhone?: string;
  userChurchId?: string;
  onComplete?: () => void;
}

export function CompleteProfileModal({
  isOpen,
  userPhone = "",
  userChurchId = "",
  onComplete,
}: CompleteProfileModalProps) {
  const [phone, setPhone] = useState(userPhone);
  const [churchId, setChurchId] = useState(userChurchId);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingChurches, setLoadingChurches] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, supabase]);

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

    if (onComplete) {
      onComplete();
    } else {
      router.refresh();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Complete seu perfil</DialogTitle>
          <DialogDescription>
            Para continuar, precisamos de algumas informações adicionais.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de Telefone *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="church">Selecione sua Igreja *</Label>
            {loadingChurches ? (
              <div className="flex items-center justify-center rounded-md border border-input p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={churchId} onValueChange={setChurchId}>
                <SelectTrigger id="church">
                  <SelectValue placeholder="Escolha uma igreja" />
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
            <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || loadingChurches}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
