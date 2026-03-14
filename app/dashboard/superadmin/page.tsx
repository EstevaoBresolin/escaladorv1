import Link from "next/link";
import { ArrowRight, Building2, Shield, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSuperAdminPage } from "@/lib/superadmin";

type ChurchRow = {
  id: string;
  name: string;
  plan: number | null;
};

type ProfileRow = {
  id: string;
  church_id: string | null;
};

type MinistryRow = {
  id: string;
  church_id: string;
};

type UserMinistryRow = {
  user_id: string;
};

export default async function SuperadminOverviewPage() {
  const { supabase } = await requireSuperAdminPage();

  const [churchesResult, profilesResult, ministriesResult, userMinistriesResult] =
    await Promise.all([
      supabase.from("churches").select("id, name, plan").order("name"),
      supabase.from("profiles").select("id, church_id"),
      supabase.from("ministries").select("id, church_id"),
      supabase.from("user_ministries").select("user_id"),
    ]);

  const churches = (churchesResult.data || []) as ChurchRow[];
  const profiles = (profilesResult.data || []) as ProfileRow[];
  const ministries = (ministriesResult.data || []) as MinistryRow[];
  const userMinistries = (userMinistriesResult.data || []) as UserMinistryRow[];

  const activeUserIds = new Set(userMinistries.map((item) => item.user_id));
  const activeUsers = profiles.filter(
    (profile) => profile.church_id && activeUserIds.has(profile.id),
  ).length;

  const rankingMap = new Map<string, number>();

  for (const profile of profiles) {
    if (!profile.church_id || !activeUserIds.has(profile.id)) {
      continue;
    }

    rankingMap.set(
      profile.church_id,
      (rankingMap.get(profile.church_id) || 0) + 1,
    );
  }

  const topChurches = churches
    .map((church) => ({
      id: church.id,
      name: church.name,
      plan: church.plan ?? 0,
      activeUsers: rankingMap.get(church.id) || 0,
      ministries: ministries.filter((ministry) => ministry.church_id === church.id)
        .length,
    }))
    .sort((left, right) => right.activeUsers - left.activeUsers)
    .slice(0, 5);

  const stats = [
    {
      title: "Usuários do sistema",
      value: profiles.length,
      subtitle: "Perfis cadastrados na plataforma",
      icon: Users,
      iconClass: "bg-primary/15 text-primary",
    },
    {
      title: "Igrejas",
      value: churches.length,
      subtitle: "Organizações ativas no ambiente",
      icon: Building2,
      iconClass: "bg-chart-1/15 text-chart-1",
    },
    {
      title: "Usuários ativos",
      value: activeUsers,
      subtitle: "Com igreja vinculada e ministério associado",
      icon: UserCheck,
      iconClass: "bg-chart-2/15 text-chart-2",
    },
    {
      title: "Ministérios",
      value: ministries.length,
      subtitle: "Estruturas cadastradas em todas as igrejas",
      icon: Shield,
      iconClass: "bg-chart-3/15 text-chart-3",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Controle interno</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Dashboard do superadmin
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Acompanhe a saúde da operação, identifique crescimento por igreja e
              acesse a gestão global de planos e permissões.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/superadmin/igrejas">
                Gerenciar igrejas e usuários
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
                    {stat.value}
                  </p>
                </div>
                <span className={`rounded-xl p-2.5 ${stat.iconClass}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Top 5 igrejas por usuários ativos</CardTitle>
            <CardDescription>
              Ranking baseado em pessoas vinculadas a pelo menos um ministério.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Igreja</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Ativos</TableHead>
                  <TableHead className="text-right">Ministérios</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topChurches.length > 0 ? (
                  topChurches.map((church, index) => (
                    <TableRow key={church.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {index + 1}. {church.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {church.id.slice(0, 8)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {church.plan === 1 ? "WhatsApp" : "Email"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {church.activeUsers}
                      </TableCell>
                      <TableCell className="text-right">
                        {church.ministries}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Ainda não há dados suficientes para gerar o ranking.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
            <CardDescription>
              Entradas mais usadas para suporte operacional e comercial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="font-medium text-foreground">Ajustar plano de igreja</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Altere entre envio por email ou notificação via WhatsApp.
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="font-medium text-foreground">Promover usuários</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pesquise perfis e conceda permissão de administrador da igreja.
              </p>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/superadmin/igrejas">Abrir central de gestão</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}