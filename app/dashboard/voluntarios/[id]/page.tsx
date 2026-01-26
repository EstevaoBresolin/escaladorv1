import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Mail, Phone } from "lucide-react";
import Link from "next/link";

interface VolunteerPageProps {
  params: Promise<{ id: string }>;
}

export default async function VolunteerPage({ params }: VolunteerPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: volunteer } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!volunteer) {
    notFound();
  }

  const { data: ministries } = await supabase
    .from("user_ministries")
    .select(
      `
      id,
      ministries(id, name, color)
    `,
    )
    .eq("user_id", id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/voluntarios">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {volunteer.name}
            </h1>
            <p className="text-muted-foreground">Detalhes do voluntário</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/voluntarios/${id}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-card-foreground">
                    {volunteer.email}
                  </p>
                </div>
              </div>

              {volunteer.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium text-card-foreground">
                      {volunteer.phone}
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <p className="text-sm text-muted-foreground">Função</p>
                <p className="font-medium text-card-foreground capitalize">
                  {volunteer.role}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ministérios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {ministries?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              ministérios que participa
            </p>
          </CardContent>
        </Card>
      </div>

      {ministries && ministries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ministérios que Participa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ministries.map((um: any) => (
                <div
                  key={um.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: um.ministries?.color || "#3B82F6",
                    }}
                  />
                  <p className="font-medium text-foreground">
                    {um.ministries?.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
