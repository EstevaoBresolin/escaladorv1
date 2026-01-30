import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarCheck, Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <CalendarCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold text-foreground">
            Conecte Escalas
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
            Enviamos um link de confirmação para o seu email. Clique no link
            para ativar sua conta e começar a usar o Conecte Escalas.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Após confirmar seu email, você será redirecionado para completar seu perfil.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Ir para Login</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Não recebeu o email?{" "}
            <button
              type="button"
              className="text-primary hover:underline"
            >
              Reenviar
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
