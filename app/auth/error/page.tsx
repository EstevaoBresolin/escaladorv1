import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarCheck, AlertTriangle } from "lucide-react"

export default function AuthErrorPage() {
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
            <Link href="/auth/login">Tentar Novamente</Link>
          </Button>
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
