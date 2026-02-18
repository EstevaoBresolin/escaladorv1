"use client";

import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck, Loader2, Check, X, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Validação de requisitos de senha
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação detalhada da senha
    if (!passwordRequirements.minLength) {
      setError("A senha deve ter no mínimo 8 caracteres");
      setLoading(false);
      return;
    }

    if (!passwordRequirements.hasUpperCase) {
      setError("A senha deve conter pelo menos uma letra maiúscula");
      setLoading(false);
      return;
    }

    if (!passwordRequirements.hasLowerCase) {
      setError("A senha deve conter pelo menos uma letra minúscula");
      setLoading(false);
      return;
    }

    if (!passwordRequirements.hasNumber) {
      setError("A senha deve conter pelo menos um número");
      setLoading(false);
      return;
    }

    if (!passwordRequirements.hasSpecialChar) {
      setError(
        "A senha deve conter pelo menos um caractere especial (!@#$%^&*...)",
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://escaladorv1.vercel.app/auth/login",
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      // Detectar se o email já está em uso
      if (
        error.message.toLowerCase().includes("user already registered") ||
        error.message.toLowerCase().includes("email already") ||
        error.message.toLowerCase().includes("already registered")
      ) {
        setError(
          "Este email já está cadastrado. Por favor, faça login ou use outro email.",
        );
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // Verificar se o usuário já existe (Supabase retorna data.user mesmo se já existe)
    if (
      data.user &&
      data.user.identities &&
      data.user.identities.length === 0
    ) {
      setError(
        "Este email já está cadastrado. Por favor, faça login ou use outro email.",
      );
      setLoading(false);
      return;
    }

    router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <CalendarCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold text-foreground">
              Conecte Escalas
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            Crie sua conta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Comece a organizar sua igreja hoje
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
              {error.includes("já está cadastrado") && (
                <div className="mt-2">
                  <Link
                    href="/auth/login"
                    className="font-medium underline hover:text-destructive/80"
                  >
                    Ir para página de login →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Seu nome"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Indicador de requisitos de senha */}
            {showPasswordRequirements && password.length > 0 && (
              <div className="rounded-md border bg-muted/50 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Requisitos da senha:
                </p>
                <div className="space-y-1">
                  <PasswordRequirement
                    met={passwordRequirements.minLength}
                    text="Mínimo de 8 caracteres"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasUpperCase}
                    text="Uma letra maiúscula (A-Z)"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasLowerCase}
                    text="Uma letra minúscula (a-z)"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasNumber}
                    text="Um número (0-9)"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasSpecialChar}
                    text="Um caractere especial (!@#$%...)"
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar conta grátis"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Fazer login
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{" "}
          <Link href="/termos" className="underline hover:text-foreground">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" className="underline hover:text-foreground">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

// Componente auxiliar para mostrar requisitos de senha
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}
      <span
        className={
          met ? "text-emerald-600 font-medium" : "text-muted-foreground"
        }
      >
        {text}
      </span>
    </div>
  );
}
