import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-8 text-center md:p-12">
          <h2 className="mb-4 text-balance text-2xl font-bold text-primary-foreground md:text-3xl">
            Pronto para transformar a gestão da sua igreja?
          </h2>
          <p className="mb-8 text-pretty text-primary-foreground/90">
            Junte-se a centenas de igrejas que já simplificaram sua organização
            com o GoMinistry. Comece gratuitamente hoje.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* <Button
              size="lg"
              variant="secondary"
              asChild
              className="gap-2"
            >
              <Link href="/auth/sign-up">
                Criar Conta Grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button> */}
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link
                href="https://wa.me/555493098475"
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com Especialista
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
