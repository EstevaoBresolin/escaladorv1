"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserPermissions } from "@/lib/permissions";
import { Loader2, Building2 } from "lucide-react";
import { ReminderManager } from "@/components/dashboard/reminder-manager";

export default function ConfiguracoesPage() {
  const [churchName, setChurchName] = useState("");
  const [churchAddress, setChurchAddress] = useState("");
  const [churchPhone, setChurchPhone] = useState("");
  const [churchCNPJ, setChurchCNPJ] = useState("");
  const [churchId, setChurchId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      setInitialLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setInitialLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id, churches(*)")
        .eq("id", user.id)
        .single();

      if (profile?.churches) {
        const church = profile.churches as any;
        setChurchId(profile.church_id);
        setChurchName(church.name || "");
        setChurchAddress(church.address || "");
        setChurchPhone(church.phone || "");
        setChurchCNPJ(church.cnpj || "");
      }

      // Get user permissions
      const permissions = await getUserPermissions(supabase);
      setIsAdmin(permissions?.isAdmin || false);
      setInitialLoading(false);
    }

    loadSettings();
  }, [supabase]);

  function validateName(name: string): string | null {
    if (!name.trim()) {
      return "Nome da igreja é obrigatório";
    }
    if (name.trim().length < 3) {
      return "Nome deve ter pelo menos 3 caracteres";
    }
    return null;
  }

  function validateAddress(address: string): string | null {
    if (!address.trim()) {
      return "Endereço é obrigatório";
    }
    if (address.trim().length < 10) {
      return "Endereço deve ter pelo menos 10 caracteres";
    }
    return null;
  }

  function validatePhone(phone: string): string | null {
    if (!phone.trim()) {
      return "Telefone é obrigatório";
    }
    const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
    const cleanPhone = phone.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      return "Formato de telefone inválido. Use: (00) 00000-0000";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setNameError(null);
    setAddressError(null);
    setPhoneError(null);

    // Validações
    const nameValidation = validateName(churchName);
    const addressValidation = validateAddress(churchAddress);
    const phoneValidation = validatePhone(churchPhone);

    if (nameValidation || addressValidation || phoneValidation) {
      setNameError(nameValidation);
      setAddressError(addressValidation);
      setPhoneError(phoneValidation);
      setLoading(false);
      return;
    }

    if (!churchId) {
      setError("Igreja não encontrada.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("churches")
      .update({
        name: churchName,
        address: churchAddress,
        phone: churchPhone,
      })
      .eq("id", churchId);

    if (updateError) {
      setError("Erro ao atualizar configurações. Tente novamente.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    // Não precisa reload, dados já foram atualizados
  }

  if (initialLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="mt-2 h-8 w-56 rounded bg-muted" />
          <div className="mt-2 h-4 w-72 rounded bg-muted" />
        </div>
        <div className="max-w-2xl space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="space-y-2">
              <div className="h-6 w-40 rounded bg-muted" />
              <div className="h-4 w-56 rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-10 w-40 rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <p className="text-sm font-medium text-primary">
          Administração da conta
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Configurações
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie informações da igreja, lembretes e preferências
          administrativas.
        </p>
      </section>

      <div className="max-w-3xl space-y-6">
        {isAdmin && (
          <>
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Igreja
                </CardTitle>
                <CardDescription>
                  Informações básicas da sua igreja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600">
                      Configurações salvas com sucesso!
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="churchName">Nome da Igreja</Label>
                    <Input
                      id="churchName"
                      value={churchName}
                      onChange={(e) => {
                        setChurchName(e.target.value);
                        setNameError(null);
                      }}
                      onBlur={(e) => setNameError(validateName(e.target.value))}
                      className={nameError ? "border-destructive" : ""}
                      required
                    />
                    {nameError && (
                      <p className="text-sm text-destructive">{nameError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="churchAddress">Endereço</Label>
                    <Input
                      id="churchAddress"
                      value={churchAddress}
                      onChange={(e) => {
                        setChurchAddress(e.target.value);
                        setAddressError(null);
                      }}
                      onBlur={(e) =>
                        setAddressError(validateAddress(e.target.value))
                      }
                      className={addressError ? "border-destructive" : ""}
                      placeholder="Rua, número, cidade, estado"
                      required
                    />
                    {addressError && (
                      <p className="text-sm text-destructive">{addressError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="churchPhone">Telefone</Label>
                    <Input
                      id="churchPhone"
                      value={churchPhone}
                      onChange={(e) => {
                        setChurchPhone(e.target.value);
                        setPhoneError(null);
                      }}
                      onBlur={(e) =>
                        setPhoneError(validatePhone(e.target.value))
                      }
                      className={phoneError ? "border-destructive" : ""}
                      placeholder="(00) 00000-0000"
                      required
                    />
                    {phoneError && (
                      <p className="text-sm text-destructive">{phoneError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="churchCNPJ">CNPJ</Label>
                    <Input
                      id="churchCNPJ"
                      value={churchCNPJ}
                      disabled
                      placeholder="CNPJ (não editável)"
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O CNPJ não pode ser alterado após a criação
                    </p>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <ReminderManager />
            </div>
          </>
        )}

        <Card className="rounded-2xl border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>
              Excluir Conta
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Entre em contato com o suporte para excluir sua conta.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
