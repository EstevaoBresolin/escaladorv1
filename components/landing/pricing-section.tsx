import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Básico",
    description: "Para igrejas pequenas que estão começando",
    price: "Grátis",
    period: "",
    features: [
      "Até 3 ministérios",
      "Até 30 voluntários",
      "Calendário de escalas",
      "Notificações por email",
      "Suporte por email",
    ],
    cta: "Começar Grátis",
    href: "/auth/sign-up?plan=basic",
    highlighted: false,
  },
  {
    name: "Profissional",
    description: "Para igrejas em crescimento",
    price: "R$ 79",
    period: "/mês",
    features: [
      "Ministérios ilimitados",
      "Voluntários ilimitados",
      "Escalas recorrentes",
      "Notificações WhatsApp",
      "Relatórios avançados",
      "Múltiplos administradores",
      "Suporte prioritário",
    ],
    cta: "Teste Grátis por 14 dias",
    href: "/auth/sign-up?plan=pro",
    highlighted: true,
  },
  {
    name: "Ministério",
    description: "Para denominações e grandes igrejas",
    price: "R$ 199",
    period: "/mês",
    features: [
      "Tudo do Profissional",
      "Múltiplas unidades/campus",
      "API de integração",
      "Sincronização avançada",
      "Onboarding dedicado",
      "SLA de suporte",
      "Personalização da marca",
    ],
    cta: "Falar com Vendas",
    href: "/contato",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="precos" className="bg-secondary/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Planos que cabem no orçamento da sua igreja
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Comece gratuitamente e escale conforme sua necessidade. Sem
            surpresas, sem taxas escondidas.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-primary bg-card shadow-lg"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Mais Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="mb-1 text-lg font-semibold text-card-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-card-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-sm text-card-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
