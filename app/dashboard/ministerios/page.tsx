import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, MoreVertical, Church, Layers3 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteMinistryButton } from "@/components/dashboard/delete-ministry-button";
import {
  getCachedPermissions,
  getCachedProfile,
  getCachedUser,
} from "@/lib/supabase/cache";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-feedback";

export default async function MinisteriosPage() {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    return null;
  }

  const profile = await getCachedProfile(user.id);
  const permissions = await getCachedPermissions(user.id);
import { getUserPermissionsByProfile } from "@/lib/permissions";

export default async function MinisteriosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id, role")
    .eq("id", user?.id)
    .single();

  // Get user permissions
  const permissions = user
    ? await getUserPermissionsByProfile(supabase, user.id, profile?.role)
    : null;
  const isAdmin = permissions?.isAdmin || false;
  const leaderMinistryIds = permissions?.ledMinistryIds || [];

  const memberMinistryIds =
    !isAdmin && user?.id
      ? (
          await supabase
            .from("user_ministries")
            .select("ministry_id")
            .eq("user_id", user.id)
        ).data?.map(
          (ministry: { ministry_id: string }) => ministry.ministry_id,
        ) || []
      : [];

  let ministriesQuery = supabase
    .from("ministries")
    .select(
      `
      *,
      user_ministries(count)
    `,
    )
    .eq("church_id", profile?.church_id)
    .order("name");

  if (!isAdmin) {
    const allowedMinistryIds =
      leaderMinistryIds.length > 0 ? leaderMinistryIds : memberMinistryIds;

    if (allowedMinistryIds.length === 0) {
      return (
        <div className="space-y-6">
          <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
            <p className="text-sm font-medium text-primary">
              Estrutura ministerial
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Ministérios
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nenhum ministério disponível para seu perfil no momento.
            </p>
          </section>

          <DashboardEmptyState
            icon={Church}
            title="Sem ministérios acessíveis"
            description="Fale com um administrador para ser vinculado a um ministério."
          />
        </div>
      );
    }

    ministriesQuery = ministriesQuery.in("id", allowedMinistryIds);
  }

  const { data: ministries } = await ministriesQuery;
  const ministryCount = ministries?.length || 0;
  const totalVolunteers =
    ministries?.reduce(
      (accumulator, ministry) =>
        accumulator + (ministry.user_ministries?.[0]?.count || 0),
      0,
    ) || 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              Estrutura ministerial
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Ministérios
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Organize equipes por áreas e mantenha papéis claros para cada
              função.
            </p>
          </div>
          {isAdmin && (
            <Button asChild>
              <Link href="/dashboard/ministerios/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Ministério
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Ministérios ativos
              </p>
              <span className="rounded-lg bg-primary/15 p-2 text-primary">
                <Layers3 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
              {ministryCount}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Voluntários alocados
              </p>
              <span className="rounded-lg bg-chart-1/15 p-2 text-chart-1">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
              {totalVolunteers}
            </p>
          </CardContent>
        </Card>
      </section>

      {ministries && ministries.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ministries.map((ministry) => (
            <Card key={ministry.id} className="rounded-2xl">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${ministry.color}20`,
                      color: ministry.color,
                    }}
                  >
                    <Church className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{ministry.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Módulo ministerial
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/ministerios/${ministry.id}`}>
                        Ver detalhes
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/ministerios/${ministry.id}/editar`}
                          >
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DeleteMinistryButton
                          ministryId={ministry.id}
                          ministryName={ministry.name}
                        />
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent>
                {ministry.description ? (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                    {ministry.description}
                  </p>
                ) : (
                  <p className="mb-3 text-sm text-muted-foreground">
                    Sem descrição cadastrada.
                  </p>
                )}

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {ministry.user_ministries?.[0]?.count || 0} voluntários
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <DashboardEmptyState
          icon={Church}
          title="Nenhum ministério cadastrado"
          description={
            isAdmin
              ? "Comece criando o primeiro ministério da sua igreja."
              : "Nenhum ministério disponível no momento."
          }
          action={
            isAdmin ? (
              <Button asChild>
                <Link href="/dashboard/ministerios/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Ministério
                </Link>
              </Button>
            ) : null
          }
        />
      )}
    </div>
  );
}
