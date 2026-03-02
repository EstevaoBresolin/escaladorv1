const steps = [
  {
    number: "01",
    title: "Crie ministérios",
    description:
      "Crie os ministérios da sua igreja. Configure os ministérios e convide líderes para colaborar.",
  },
  {
    number: "02",
    title: "Adicione voluntários",
    description:
      "Cadastre os membros da equipe e organize-os por ministério, função e disponibilidade.",
  },
  {
    number: "03",
    title: "Monte as escalas",
    description:
      "Crie escalas de forma visual e intuitiva. O sistema sugere voluntários com base na disponibilidade.",
  },
  {
    number: "04",
    title: "Comunique a equipe",
    description:
      "Notificações automáticas mantêm todos informados. Voluntários confirmam presença pelo app.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-secondary/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Simples de usar, poderoso em resultados
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Em poucos passos, você organiza toda a operação dos ministérios da
            sua igreja.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="mt-2 hidden h-full w-px bg-border md:block" />
                )}
              </div>
              <div className="pb-8">
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
