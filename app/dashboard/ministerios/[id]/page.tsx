import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Crown, Users } from "lucide-react";
import Link from "next/link";
import { MinistryVolunteerManager } from "@/components/dashboard/ministry-volunteer-manager";
import { MinistryLeaderManager } from "@/components/dashboard/ministry-leader-manager";
import { MinistryFunctionManager } from "@/components/dashboard/ministry-function-manager";
import { getUserPermissions } from "@/lib/permissions";

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

  const { data: volunteersRaw } = await supabase
    .from("user_ministries")
    .select(
      `
      id,
      profiles(id, name, email)
    `,
    )
    .eq("ministry_id", id);

  const volunteers = (volunteersRaw || []).map((v: any) => ({
    id: v.id,
    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
  }));

  // Get the current user's church to fetch all available volunteers
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, role")
    .eq("id", user?.id)
    .single();

  // Get user permissions
  const permissions = await getUserPermissions(supabase);
  const isAdmin = permissions?.isAdmin || false;
  const isLeaderOfThisMinistry =
    permissions?.ledMinistryIds.includes(id) || false;
  const canManage = isAdmin || isLeaderOfThisMinistry;

  // Get all volunteers from the same church
  const { data: allVolunteers } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("church_id", profile?.church_id)
    .order("name");

  // Get ministry leaders
  const { data: leadersRaw } = await supabase
    .from("ministry_leaders")
    .select(
      `
      id,
      user_id,
      profiles(id, name, email)
    `,
    )
    .eq("ministry_id", id);

  const leaders = (leadersRaw || []).map((leader: any) => ({
    id: leader.id,
    user_id: leader.user_id,
    profiles: Array.isArray(leader.profiles)
      ? leader.profiles[0]
      : leader.profiles,
  }));

  // Get ministry functions
  const { data: ministryFunctions } = await supabase
    .from("ministry_functions")
    .select("id, name")
    .eq("ministry_id", id)
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
        {isAdmin && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/ministerios/${id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        )}
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Lideres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-500">
                {leaders?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                lideres deste ministerio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Voluntarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {volunteers?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">
                voluntarios neste ministerio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Lideres do Ministerio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MinistryLeaderManager
            ministryId={id}
            leaders={leaders || []}
            availableVolunteers={allVolunteers || []}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funções do Ministério</CardTitle>
        </CardHeader>
        <CardContent>
          <MinistryFunctionManager
            ministryId={id}
            initialFunctions={ministryFunctions || []}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Voluntarios do Ministerio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canManage ? (
            <MinistryVolunteerManager
              ministryId={id}
              members={volunteers || []}
              availableVolunteers={allVolunteers || []}
            />
          ) : (
            <div className="space-y-2">
              {(volunteers || []).length > 0 ? (
                (volunteers || []).map(
                  (member: {
                    id: string;
                    profiles: {
                      id: string;
                      name: string;
                      email: string;
                    } | null;
                  }) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {member.profiles?.name
                          ? member.profiles.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : "?"}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {member.profiles?.name || "Voluntario nao encontrado"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profiles?.email}
                        </p>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum voluntario neste ministerio.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
