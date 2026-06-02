import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Mail, Phone, UserRound, Church } from "lucide-react";
import Link from "next/link";
import { getUserPermissionsByProfile } from "@/lib/permissions";

interface VolunteerPageProps {
  params: Promise<{ id: string }>;
}

export default async function VolunteerPage({ params }: VolunteerPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();
  const permissions = user
    ? await getUserPermissionsByProfile(supabase, user.id, currentProfile?.role)
    : null;
  const isAdmin = permissions?.isAdmin || false;
  const isOwnProfile = user?.id === id;
  const canEdit = isAdmin || isOwnProfile;
  const canViewPhone = isAdmin || isOwnProfile;

  // Permission check happens before the data fetch so sensitive columns
  // (phone) are only requested when the caller is actually authorised.
  const selectColumns = canViewPhone
    ? "id, name, role, email, phone"
    : "id, name, role, email";

  const { data: volunteer } = await supabase
    .from("profiles")
    .select(selectColumns)
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

  const initials = volunteer.name
    ? volunteer.name
        .split(" ")
        .map((namePart: string) => namePart[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">
              Cadastro de voluntário
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {volunteer.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Visão detalhada do perfil e vínculos ministeriais.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/voluntarios">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            {canEdit && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/voluntarios/${id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl sm:col-span-2 lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {initials}
            </div>
            <p className="text-sm text-muted-foreground">Identidade visual</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ministérios</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-primary">
              {ministries?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Função</p>
            <p className="mt-1 text-lg font-semibold capitalize text-card-foreground">
              {volunteer.role}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Contato principal</p>
            <p className="mt-1 truncate text-sm font-medium text-card-foreground">
              {volunteer.email}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Informações de contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {volunteer.email}
                  </p>
                </div>
              </div>

              {canViewPhone && volunteer.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium text-card-foreground">
                      {volunteer.phone}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <UserRound className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Perfil</p>
                  <p className="text-sm font-medium capitalize text-card-foreground">
                    {volunteer.role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="h-5 w-5 text-primary" />
                Ministérios que participa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ministries && ministries.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {ministries.map((userMinistry: any) => (
                    <div
                      key={userMinistry.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background/70 p-3"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            userMinistry.ministries?.color || "#3B82F6",
                        }}
                      />
                      <p className="font-medium text-foreground">
                        {userMinistry.ministries?.name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Este voluntário ainda não participa de ministérios.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
