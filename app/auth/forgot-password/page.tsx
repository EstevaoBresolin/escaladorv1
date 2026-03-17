"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://goministry.com.br/auth/reset-password",
    });

    if (error) {
      setError("Erro ao enviar email de recuperacao. Tente novamente.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Email enviado!</h1>
          <p className="mt-4 text-muted-foreground">
            Enviamos um link de recuperacao para <strong>{email}</strong>.
            Verifique sua caixa de entrada e siga as instrucoes para redefinir
            sua senha.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Nao recebeu o email? Verifique sua pasta de spam ou{" "}
            <button
              onClick={() => setSuccess(false)}
              className="text-primary hover:underline"
            >
              tente novamente
            </button>
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="mt-6 w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
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
            Esqueceu sua senha?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Digite seu email e enviaremos um link para redefinir sua senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar link de recuperacao"
            )}
          </Button>
        </form>

        <Link href="/auth/login">
          <Button variant="ghost" className="mt-4 w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o login
          </Button>
        </Link>
      </div>
    </div>
  );
}
