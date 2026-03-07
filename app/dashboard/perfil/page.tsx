"use client";

import React from "react";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { normalizeBrazilianPhone } from "@/lib/phone";

export default function PerfilPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [churchId, setChurchId] = useState<string | null>(null);
  const [originalChurchId, setOriginalChurchId] = useState<string | null>(null);
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewChurchDialog, setShowNewChurchDialog] = useState(false);
  const [newChurchName, setNewChurchName] = useState("");
  const [newChurchAddress, setNewChurchAddress] = useState("");
  const [newChurchPhone, setNewChurchPhone] = useState("");
  const [creatingChurch, setCreatingChurch] = useState(false);
  const [loadingResetPassword, setLoadingResetPassword] = useState(false);
  const [successResetPassword, setSuccessResetPassword] = useState(false);
  const [errorResetPassword, setErrorPassword] = useState<string | null>(null);
  const [openDialogResetPassword, setOpenDialogResetPassword] = useState(false);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadProfile() {
      setInitialLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setInitialLoading(false);
        return;
      }

      // Carregar perfil do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.name || "");
        setEmail(profile.email || user.email || "");
        setPhone(profile.phone || "");
        setChurchId(profile.church_id || null);
        setOriginalChurchId(profile.church_id || null);
      }

      // Carregar todas as igrejas
      const { data: churchesData } = await supabase
        .from("churches")
        .select("id, name")
        .order("name");

      if (churchesData) {
        setChurches(churchesData);
      }

      setInitialLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function handleCreateChurch(e: React.FormEvent) {
    e.preventDefault();
    setCreatingChurch(true);
    setError(null);

    let normalizedChurchPhone: string | null = null;
    if (newChurchPhone.trim()) {
      const result = normalizeBrazilianPhone(newChurchPhone);
      if (result.error || !result.value) {
        setError(result.error || "Número de telefone inválido");
        setCreatingChurch(false);
        return;
      }
      normalizedChurchPhone = result.value;
    }

    const { data: newChurch, error: createError } = await supabase
      .from("churches")
      .insert({
        name: newChurchName,
        address: newChurchAddress || null,
        phone: normalizedChurchPhone,
      })
      .select()
      .single();

    if (createError) {
      setError("Erro ao criar igreja. Tente novamente.");
      setCreatingChurch(false);
      return;
    }

    if (newChurch) {
      setChurches([...churches, { id: newChurch.id, name: newChurch.name }]);
      setChurchId(newChurch.id);
      setNewChurchName("");
      setNewChurchAddress("");
      setNewChurchPhone("");
      setShowNewChurchDialog(false);
    }

    setCreatingChurch(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    let normalizedPhone: string | null = null;
    if (phone.trim()) {
      const result = normalizeBrazilianPhone(phone);
      if (result.error || !result.value) {
        setError(result.error || "Número de telefone inválido");
        setLoading(false);
        return;
      }
      normalizedPhone = result.value;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Você precisa estar logado.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: fullName,
        phone: normalizedPhone,
        church_id: churchId,
      })
      .eq("id", user.id);

    if (updateError) {
      setError("Erro ao atualizar perfil. Tente novamente.");
      setLoading(false);
      return;
    }

    if (originalChurchId && churchId && originalChurchId !== churchId) {
      await Promise.all([
        supabase.from("user_ministries").delete().eq("user_id", user.id),
        supabase.from("volunteer_slots").delete().eq("user_id", user.id),
        supabase.from("ministry_leaders").delete().eq("user_id", user.id),
      ]);
      setOriginalChurchId(churchId);
    }

    setSuccess(true);
    setLoading(false);
    // Não precisa reload, dados já foram atualizados no estado
  }

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoadingResetPassword(true);
    setErrorPassword(null);

    const { error: errorResetPassword } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://goministry.com.br/auth/reset-password",
      });

    if (errorResetPassword) {
      setErrorPassword("Erro ao enviar email de recuperacao. Tente novamente.");
      setLoadingResetPassword(false);
      return;
    }

    setSuccessResetPassword(true);
    setLoadingResetPassword(false);
  }

  if (initialLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="mt-2 h-8 w-56 rounded bg-muted" />
          <div className="mt-2 h-4 w-72 rounded bg-muted" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl lg:col-span-2">
            <CardContent className="space-y-4 p-6">
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-10 w-36 rounded bg-muted" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 p-6">
              <div className="h-24 w-24 rounded-full bg-muted mx-auto" />
              <div className="h-4 w-2/3 rounded bg-muted mx-auto" />
              <div className="h-4 w-1/2 rounded bg-muted mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <p className="text-sm font-medium text-primary">Área da conta</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Meu Perfil
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atualize seus dados pessoais, igreja vinculada e segurança da conta.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
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
                  Perfil atualizado com sucesso!
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado.
                </p>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="church">Igreja</Label>
                </div>
                <select
                  id="church"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={churchId || ""}
                  onChange={(e) => setChurchId(e.target.value || null)}
                >
                  <option value="">Selecione uma igreja</option>
                  {churches.map((church) => (
                    <option key={church.id} value={church.id}>
                      {church.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Selecione a igreja à qual você pertence.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div>
                  <Input
                    id="password"
                    type="password"
                    value={"***********"}
                    disabled
                  />
                  <Button
                    variant="link"
                    type="button"
                    className="p-0 m-0 cursor-pointer text-xs text-muted-foreground"
                    onClick={() => setOpenDialogResetPassword(true)}
                  >
                    Alterar a senha.
                  </Button>
                </div>
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

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Foto do Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {initials}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              A foto do perfil é gerada automaticamente com suas iniciais.
            </p>
            <div className="mt-5 w-full rounded-xl border border-border bg-background/70 p-3">
              <p className="text-xs font-medium text-foreground">
                Conta vinculada
              </p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                {email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={openDialogResetPassword}
        onOpenChange={setOpenDialogResetPassword}
      >
        <DialogContent className="sm:max-w-sm">
          {successResetPassword ? (
            <DialogHeader>
              <DialogTitle>Email enviado!</DialogTitle>
              <DialogDescription>
                Email de redefinição de senha enviado com sucesso!
              </DialogDescription>
            </DialogHeader>
          ) : loadingResetPassword ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Alteração de senha</DialogTitle>
                <DialogDescription>
                  Um link de redefinição de senha será enviado para o seu email.
                </DialogDescription>
              </DialogHeader>
              {errorResetPassword && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {errorResetPassword}
                </div>
              )}
              <Button onClick={handleResetPassword} className="w-full">
                Enviar link de redefinição de senha
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
