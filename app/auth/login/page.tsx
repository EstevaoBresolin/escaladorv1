"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const LOGIN_BLOCKED_UNTIL_KEY = "login-blocked-until";

type ProfileWithChurch = {
  phone: string | null;
  church_id: string | null;
  role: string | null;
  church: { active: boolean } | null;
};

function formatRemainingMinutes(seconds: number) {
  const minutes = Math.max(Math.ceil(seconds / 60), 1);
  const minuteLabel = minutes === 1 ? "minuto" : "minutos";
  return `${minutes} ${minuteLabel}`;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const router = useRouter();
  const supabase = createClient();

  const remainingBlockSeconds = Math.max(
    Math.ceil((blockedUntil - now) / 1000),
    0,
  );
  const isBlocked = remainingBlockSeconds > 0;
  const displayError = isBlocked
    ? `Muitas tentativas. Aguarde ${formatRemainingMinutes(remainingBlockSeconds)} para tentar novamente.`
    : error;

  useEffect(() => {
    const raw = window.localStorage.getItem(LOGIN_BLOCKED_UNTIL_KEY);
    const savedUntil = raw ? Number(raw) : 0;

    if (Number.isFinite(savedUntil) && savedUntil > Date.now()) {
      setBlockedUntil(savedUntil);
      setNow(Date.now());
      return;
    }

    window.localStorage.removeItem(LOGIN_BLOCKED_UNTIL_KEY);
  }, []);

  useEffect(() => {
    if (!isBlocked) {
      if (blockedUntil > 0) {
        window.localStorage.removeItem(LOGIN_BLOCKED_UNTIL_KEY);
      }
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isBlocked, blockedUntil]);

  function blockLoginForSeconds(seconds: number) {
    const validSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
    const until = Date.now() + validSeconds * 1000;

    setBlockedUntil(until);
    setNow(Date.now());
    setError(null);
    window.localStorage.setItem(LOGIN_BLOCKED_UNTIL_KEY, String(until));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isBlocked) {
      return;
    }

    setLoading(true);
    setError(null);

    const loginResponse = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!loginResponse.ok) {
      const body = await loginResponse.json().catch(() => null);

      if (loginResponse.status === 429) {
        const retryAfter = Number(loginResponse.headers.get("Retry-After"));
        blockLoginForSeconds(retryAfter);
      } else {
        const retryAfter = Number(loginResponse.headers.get("Retry-After"));
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          blockLoginForSeconds(retryAfter);
        } else {
          const remainingAttempts = Number(body?.remainingAttempts);

          if (Number.isFinite(remainingAttempts) && remainingAttempts > 0) {
            const tentativaLabel =
              remainingAttempts === 1 ? "tentativa" : "tentativas";
            setError(
              `Email ou senha incorretos. Restam ${remainingAttempts} ${tentativaLabel}.`,
            );
          } else {
            setError(
              body?.error || "Email ou senha incorretos. Tente novamente.",
            );
          }
        }
      }

      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, church_id, role, church:churches(active)")
        .eq("id", user.id)
        .single() as { data: ProfileWithChurch | null };

      if (profile?.role === "superadmin") {
        router.push("/dashboard/superadmin");
        return;
      }

      if (profile?.church?.active === false) {
        router.push("/dashboard/perfil");
        return;
      }

      if (!profile?.phone || !profile?.church_id) {
        router.push("/complete-profile");
        router.refresh();
        return;
      }

      if (profile?.role === "admin") {
        router.push("/dashboard");
        return;
      }

      if (profile?.role === "member") {
        router.push("/dashboard");
        return;
      }

      if (profile?.role === "leader") {
        router.push("/dashboard/eventos");
        return;
      }

      const { data: ledMinistries } = await supabase
        .from("ministry_leaders")
        .select("ministry_id")
        .eq("user_id", user.id)
        .limit(1);

      if (ledMinistries && ledMinistries.length > 0) {
        router.push("/dashboard/eventos");
        return;
      }

      router.push("/dashboard/disponibilidade");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4 py-10">
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg">
              <Image
                src="/icon-dark-32x32.png"
                alt="GoMinistry"
                width={40}
                height={40}
              />
            </div>
            <span className="text-2xl font-semibold text-foreground">
              GoMinistry
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Entre na sua conta para continuar
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {displayError}
              </div>
            )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || isBlocked}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : isBlocked ? (
                `Bloqueado (${formatRemainingMinutes(remainingBlockSeconds)})`
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem uma conta?{" "}
            <Link href="/auth/sign-up" className="text-primary hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
