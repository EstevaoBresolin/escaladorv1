import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Pastor Ricardo Silva",
    role: "Igreja Batista Central",
    content:
      "O Go Ministry transformou a forma como organizamos nossos ministérios. Antes, passávamos horas no WhatsApp tentando montar escalas. Agora, tudo é feito em minutos.",
    rating: 5,
  },
  {
    name: "Maria Santos",
    role: "Líder de Louvor - Comunidade da Fé",
    content:
      "Finalmente uma ferramenta pensada para igrejas! A interface é intuitiva e os voluntários adoraram poder ver suas escalas pelo celular. Recomendo demais!",
    rating: 5,
  },
  {
    name: "Carlos Oliveira",
    role: "Coordenador Geral - Igreja Presbiteriana",
    content:
      "Gerenciamos 12 ministérios com mais de 200 voluntários. O Go Ministry nos deu a visibilidade que precisávamos para coordenar tudo de forma eficiente.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">
            Igrejas que confiam no Go Ministry
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Veja como outras comunidades estão transformando sua gestão de
            ministérios.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-primary text-primary"
                  />
                ))}
              </div>
              <p className="mb-6 flex-1 text-card-foreground leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-card-foreground">
                  {testimonial.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
