import {
  CalendarDays,
  Users,
  Bell,
  Shield,
  Smartphone,
  BarChart3,
  Clock,
  Repeat,
} from "lucide-react"

const features = [
  {
    icon: CalendarDays,
    title: "Calendário Integrado",
    description:
      "Visualize todas as escalas e eventos em um calendário intuitivo. Sincronize com Google Calendar e outros serviços.",
  },
  {
    icon: Users,
    title: "Gestão de Ministérios",
    description:
      "Organize voluntários por ministério, função e disponibilidade. Controle permissões de acesso facilmente.",
  },
  {
    icon: Bell,
    title: "Notificações Inteligentes",
    description:
      "Envie lembretes automáticos por email ou WhatsApp. Confirme presença com um clique.",
  },
  {
    icon: Repeat,
    title: "Escalas Recorrentes",
    description:
      "Crie padrões de escala que se repetem automaticamente. Economize tempo na organização semanal.",
  },
  {
    icon: Clock,
    title: "Gestão de Disponibilidade",
    description:
      "Voluntários podem informar sua disponibilidade diretamente no sistema. Evite conflitos de agenda.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Detalhados",
    description:
      "Acompanhe participação, frequência e métricas dos ministérios. Tome decisões baseadas em dados.",
  },
  {
    icon: Smartphone,
    title: "Acesso Mobile",
    description:
      "Interface responsiva que funciona perfeitamente em qualquer dispositivo. Acesse de onde estiver.",
  },
  {
    icon: Shield,
    title: "Segurança e Privacidade",
    description:
      "Dados protegidos com criptografia. Controle quem pode ver e editar informações.",
  },
]

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Tudo que você precisa para organizar sua igreja
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Recursos completos para simplificar a gestão de ministérios e
            voluntários. Foque no que importa: servir a comunidade.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
