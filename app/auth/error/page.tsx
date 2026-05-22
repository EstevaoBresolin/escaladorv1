import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
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

        <div className="mt-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            Erro de Autenticação
          </h1>
          <p className="mt-4 text-muted-foreground">
            Ocorreu um erro durante o processo de autenticação. Por favor, tente
            novamente ou entre em contato com o suporte se o problema persistir.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button asChild className="w-full">
            <a href="/auth/login">Tentar Novamente</a>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
