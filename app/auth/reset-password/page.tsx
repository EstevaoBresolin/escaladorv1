"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarCheck,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  useEffect(() => {
    // Check if user has a valid recovery session
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    }
    checkSession();

    // Listen for auth state changes (when user clicks the reset link)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem");
      return;
    }

    if (!passwordRequirements.minLength) {
      setError("A senha deve ter no minimo 8 caracteres");
      return;
    }

    if (!passwordRequirements.hasUpperCase) {
      setError("A senha deve conter pelo menos uma letra maiuscula");
      return;
    }

    if (!passwordRequirements.hasLowerCase) {
      setError("A senha deve conter pelo menos uma letra minuscula");
      return;
    }

    if (!passwordRequirements.hasNumber) {
      setError("A senha deve conter pelo menos um numero");
      return;
    }

    if (!passwordRequirements.hasSpecialChar) {
      setError(
        "A senha deve conter pelo menos um caractere especial (!@#$%^&*...)",
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError("Erro ao redefinir senha. Tente novamente.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  }

  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando sessao...</p>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Link invalido ou expirado
          </h1>
          <p className="mt-4 text-muted-foreground">
            O link de recuperacao de senha expirou ou ja foi utilizado. Solicite
            um novo link.
          </p>
          <Link href="/auth/forgot-password">
            <Button className="mt-6 w-full">Solicitar novo link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Senha redefinida!
          </h1>
          <p className="mt-4 text-muted-foreground">
            Sua senha foi alterada com sucesso. Voce sera redirecionado para o
            dashboard em instantes...
          </p>
          <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
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
            Redefinir senha
          </h1>
          <p className="mt-2 text-muted-foreground">
            Digite sua nova senha abaixo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
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
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {showPasswordRequirements && password.length > 0 && (
              <div className="rounded-md border bg-muted/50 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Requisitos da senha:
                </p>
                <div className="space-y-1">
                  <PasswordRequirement
                    met={passwordRequirements.minLength}
                    text="Minimo de 8 caracteres"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasUpperCase}
                    text="Uma letra maiuscula (A-Z)"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasLowerCase}
                    text="Uma letra minuscula (a-z)"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasNumber}
                    text="Um numero (0-9)"
                  />
                  <PasswordRequirement
                    met={passwordRequirements.hasSpecialChar}
                    text="Um caractere especial (!@#$%...)"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redefinindo...
              </>
            ) : (
              "Redefinir senha"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

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
