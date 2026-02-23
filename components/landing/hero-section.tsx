import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Users, Bell } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-32">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent_0%,var(--color-background)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--color-background)_85%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Nova versão disponível
          </div>
          
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Simplifique a gestão de escalas da sua{" "}
            <span className="text-primary">igreja</span>
          </h1>
          
          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            Organize ministérios, gerencie voluntários e crie escalas de forma 
            simples e eficiente. Conecte sua equipe e mantenha todos informados 
            em tempo real.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="gap-2">
              <Link href="/auth/sign-up">
                Começar Gratuitamente
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#como-funciona">Ver Demonstração</Link>
            </Button>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground">
            14 dias grátis. Sem necessidade de cartão de crédito.
          </p>
        </div>
        
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Calendar,
              title: "Escalas Inteligentes",
              description: "Crie e gerencie escalas com facilidade",
            },
            {
              icon: Users,
              title: "Gestão de Voluntários",
              description: "Organize equipes por ministério",
            },
            {
              icon: Bell,
              title: "Notificações Automáticas",
              description: "Mantenha todos informados",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center gap-3 rounded-xl border border-border/70 bg-card/80 p-6 text-center shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
