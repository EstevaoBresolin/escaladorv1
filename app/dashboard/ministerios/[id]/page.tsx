import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Crown, Users, Church } from "lucide-react";
import Link from "next/link";
import { MinistryVolunteerManager } from "@/components/dashboard/ministry-volunteer-manager";
import { MinistryLeaderManager } from "@/components/dashboard/ministry-leader-manager";
import { MinistryFunctionManager } from "@/components/dashboard/ministry-function-manager";
import { getUserPermissionsByProfile } from "@/lib/permissions";

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

  const PAGE_SIZE = 1000;
  let from = 0;
  const volunteersRaw: any[] = [];

  while (true) {
    const { data: batch } = await supabase
      .from("user_ministries")
      .select(
        `
        id,
        profiles(id, name, email)
      `,
      )
      .eq("ministry_id", id)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    const rows = batch || [];
    volunteersRaw.push(...rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  const volunteers = (volunteersRaw || []).map((volunteer: any) => ({
    id: volunteer.id,
    profiles: Array.isArray(volunteer.profiles)
      ? volunteer.profiles[0]
      : volunteer.profiles,
  }));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, role")
    .eq("id", user?.id)
    .single();

  const permissions = user
    ? await getUserPermissionsByProfile(supabase, user.id, profile?.role)
    : null;
  const isAdmin = permissions?.isAdmin || false;
  const isLeaderOfThisMinistry =
    permissions?.ledMinistryIds.includes(id) || false;
  const canManage = isAdmin || isLeaderOfThisMinistry;

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

  const { data: ministryFunctions } = await supabase
    .from("ministry_functions")
    .select("id, name")
    .eq("ministry_id", id)
    .order("name");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">
              Gestão ministerial
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {ministry.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Painel de organização do ministério.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/ministerios">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/ministerios/${id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Líderes</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-amber-500">
              {leaders?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Voluntários</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-primary">
              {volunteers?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Funções</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-card-foreground">
              {ministryFunctions?.length || 0}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {/* <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-medium text-card-foreground">
                  {ministry.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Cor</p>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded border"
                    style={{ backgroundColor: ministry.color }}
                  />
                  <p className="text-sm font-medium text-card-foreground">
                    {ministry.color}
                  </p>
                </div>
              </div>

              {ministry.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="mt-1 text-sm text-card-foreground">
                    {ministry.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card> */}

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4 text-amber-500" />
                Lideranças
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MinistryLeaderManager
                ministryId={id}
                leaders={leaders || []}
                churchId={profile?.church_id || ministry.church_id}
                isAdmin={isAdmin}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Funções do ministério</CardTitle>
            </CardHeader>
            <CardContent>
              <MinistryFunctionManager
                ministryId={id}
                initialFunctions={ministryFunctions || []}
                canManage={canManage}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Voluntários do ministério
              </CardTitle>
            </CardHeader>
            <CardContent>
              {canManage ? (
                <MinistryVolunteerManager
                  ministryId={id}
                  members={volunteers || []}
                  churchId={profile?.church_id || ministry.church_id}
                />
              ) : (
                <div className="space-y-2">
                  {(volunteers || []).length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-border">
                      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)] gap-4 border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                        <p>Nome</p>
                        <p>Contato</p>
                      </div>
                      <div className="max-h-[440px] overflow-y-auto">
                        {(volunteers || []).map(
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
                              className="grid gap-3 border-t border-border px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)] md:items-center md:gap-4 overflow-hidden"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                  {member.profiles?.name
                                    ? member.profiles.name
                                        .split(" ")
                                        .map((namePart: string) => namePart[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()
                                    : "?"}
                                </div>
                                <p className="font-medium text-card-foreground truncate">
                                  {member.profiles?.name ||
                                    "Voluntário não encontrado"}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {member.profiles?.email || "-"}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Nenhum voluntário neste ministério.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
