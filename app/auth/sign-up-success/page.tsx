"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Mail, Loader2, CheckCircle } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <Suspense>
      <SignUpSuccessContent />
    </Suspense>
  );
}

function SignUpSuccessContent() {
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) {
      setEmail(emailFromQuery);
      if (typeof window !== "undefined") {
        localStorage.setItem("signup_email", emailFromQuery);
      }
      return;
    }

    const savedEmail =
      typeof window !== "undefined"
        ? localStorage.getItem("signup_email")
        : null;
    if (savedEmail) {
      setEmail(savedEmail);
      return;
    }

    async function getEmail() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        if (typeof window !== "undefined") {
          localStorage.setItem("signup_email", user.email);
        }
      }
    }
    getEmail();
  }, [supabase, searchParams]);

  async function handleResendEmail() {
    if (!email) {
      setResendError("Email não encontrado. Tente criar sua conta novamente.");
      return;
    }

    setResending(true);
    setResendError(null);
    setResendSuccess(false);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: "https://escaladorv1.vercel.app/auth/login",
      },
    });

    if (error) {
      setResendError(
        "Erro ao reenviar email. Tente novamente em alguns minutos.",
      );
    } else {
      setResendSuccess(true);
    }

    setResending(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <CalendarCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold text-foreground">
            Go Ministry
          </span>
        </Link>

        <div className="mt-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            Verifique seu email
          </h1>
          <p className="mt-4 text-muted-foreground">
            Enviamos um link de confirmação para{" "}
            {email && <strong>{email}</strong>}. Clique no link para ativar sua
            conta e começar a usar o Go Ministry.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {resendSuccess && (
            <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Email reenviado com sucesso!
            </div>
          )}

          {resendError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {resendError}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Após confirmar seu email, você será redirecionado para completar seu
            perfil.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Ir para Login</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Não recebeu o email?{" "}
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resending || resendSuccess}
              className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              {resending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Reenviando...
                </>
              ) : resendSuccess ? (
                "Email reenviado"
              ) : (
                "Reenviar"
              )}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
