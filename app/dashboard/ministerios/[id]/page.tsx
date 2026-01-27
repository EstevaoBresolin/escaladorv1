import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { MinistryVolunteerManager } from "@/components/dashboard/ministry-volunteer-manager";

interface MinistryPageProps {
  params: Promise<{ id: string }>;
}

export default async function MinistryPage({ params }: MinistryPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ministry } = await supabase
    .from("ministries")
    .select(
      `
      *,
      user_ministries(
        count
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!ministry) {
    notFound();
  }

  const { data: volunteers } = await supabase
    .from("user_ministries")
    .select(
      `
      id,
      profiles(id, name, email)
    `,
    )
    .eq("ministry_id", id);

  // Get the current user's church to fetch all available volunteers
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", user?.id)
    .single();

  // Get all volunteers from the same church
  const { data: allVolunteers } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("church_id", profile?.church_id)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/ministerios">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {ministry.name}
            </h1>
            <p className="text-muted-foreground">Detalhes do ministério</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/ministerios/${id}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium text-card-foreground">
                  {ministry.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Cor</p>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border"
                    style={{ backgroundColor: ministry.color }}
                  />
                  <p className="font-medium text-card-foreground">
                    {ministry.color}
                  </p>
                </div>
              </div>

              {ministry.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-card-foreground">{ministry.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Voluntários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {volunteers?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              voluntários neste ministério
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voluntários do Ministério</CardTitle>
        </CardHeader>
        <CardContent>
          <MinistryVolunteerManager
            ministryId={id}
            members={volunteers || []}
            availableVolunteers={allVolunteers || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
