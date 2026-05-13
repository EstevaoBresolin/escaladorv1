"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Download,
  Loader2,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateChurchMembersPdf } from "@/lib/pdf-export";

type ChurchOption = {
  id: string;
  name: string;
  plan: number;
  active: boolean;
};

type ChurchDetails = {
  church: {
    id: string;
    name: string;
    plan: number;
    active: boolean;
  };
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalMinistries: number;
    activeUsers: number;
    usersWithoutMinistry: number;
  };
};

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  churchId: string | null;
  churchName: string | null;
  ministryCount: number;
  hasMinistry: boolean;
};

type ChurchMemberReportItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  hasMinistry: boolean;
  ministryCount: number;
  ministries: string[];
};

type ChurchMembersReportResponse = {
  church?: {
    id: string;
    name: string;
  };
  members?: ChurchMemberReportItem[];
  error?: string;
};

interface SuperadminManagementClientProps {
  initialChurches: ChurchOption[];
}

const planLabels: Record<number, string> = {
  0: "Email",
  1: "WhatsApp",
};

export function SuperadminManagementClient({
  initialChurches,
}: SuperadminManagementClientProps) {
  const [selectedChurchId, setSelectedChurchId] = useState(
    initialChurches[0]?.id || "",
  );
  const [churches, setChurches] = useState(initialChurches);

  const [selectedPlan, setSelectedPlan] = useState(
    String(initialChurches[0]?.plan ?? 0),
  );
  const [churchDetails, setChurchDetails] = useState<ChurchDetails | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDetails, startDetailsTransition] = useTransition();
  const [isSavingPlan, startPlanTransition] = useTransition();
  const [isSavingChurchStatus, startChurchStatusTransition] = useTransition();
  const [isLoadingUsers, startUsersTransition] = useTransition();
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [isExportingReport, setIsExportingReport] = useState(false);

  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  const selectedChurch = useMemo(
    () => churches.find((church) => church.id === selectedChurchId) || null,
    [churches, selectedChurchId],
  );

  useEffect(() => {
    if (!selectedChurchId) {
      setChurchDetails(null);
      return;
    }

    startDetailsTransition(async () => {
      setError(null);

      const response = await fetch(
        `/api/superadmin/churches/${selectedChurchId}`,
      );
      const body = (await response.json()) as
        | ChurchDetails
        | { error?: string };

      if (!response.ok || !("church" in body)) {
        setChurchDetails(null);
        setError(
          body && "error" in body
            ? body.error || "Erro ao carregar igreja."
            : "Erro ao carregar igreja.",
        );
        return;
      }

      setChurchDetails(body);
      setSelectedPlan(String(body.church.plan));
    });
  }, [selectedChurchId]);

  useEffect(() => {
    const shouldSearch =
      deferredSearchTerm.length >= 2 || Boolean(selectedChurchId);

    if (!shouldSearch) {
      setUsers([]);
      return;
    }

    startUsersTransition(async () => {
      setError(null);

      const params = new URLSearchParams();
      if (selectedChurchId) {
        params.set("churchId", selectedChurchId);
      }
      if (deferredSearchTerm) {
        params.set("q", deferredSearchTerm);
      }

      const response = await fetch(
        `/api/superadmin/users?${params.toString()}`,
      );
      const body = (await response.json()) as {
        users?: ManagedUser[];
        error?: string;
      };

      if (!response.ok) {
        setUsers([]);
        setError(body.error || "Erro ao buscar usuários.");
        return;
      }

      setUsers(body.users || []);
    });
  }, [deferredSearchTerm, selectedChurchId]);

  async function handlePlanSave() {
    if (!selectedChurchId) {
      return;
    }

    startPlanTransition(async () => {
      setError(null);
      setFeedback(null);

      const response = await fetch(
        `/api/superadmin/churches/${selectedChurchId}/plan`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan: Number(selectedPlan) }),
        },
      );

      const body = (await response.json()) as {
        church?: { plan: number };
        error?: string;
      };

      if (!response.ok) {
        setError(body.error || "Erro ao atualizar plano.");
        return;
      }

      setFeedback("Plano da igreja atualizado com sucesso.");
      setChurchDetails((current) =>
        current
          ? {
              ...current,
              church: {
                ...current.church,
                plan: body.church?.plan ?? current.church.plan,
              },
            }
          : current,
      );
    });
  }

  async function handleToggleChurchStatus() {
    if (!selectedChurchId || !churchDetails) return;

    startChurchStatusTransition(async () => {
      setError(null);
      setFeedback(null);

      const nextActive = !churchDetails.church.active;
      const response = await fetch(
        `/api/superadmin/churches/${selectedChurchId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: nextActive }),
        },
      );

      const body = (await response.json()) as {
        church?: { id: string; name: string; plan: number; active: boolean };
        error?: string;
      };

      if (!response.ok) {
        setError(body.error || "Erro ao atualizar status da igreja.");
        return;
      }

      if (body.church) {
        setChurchDetails((current) =>
          current
            ? {
                ...current,
                church: { ...current.church, active: body.church?.active ?? current.church.active },
              }
            : current,
        );

        setChurches((current) =>
          current.map((church) =>
            church.id === body.church?.id
              ? { ...church, active: body.church.active }
              : church,
          ),
        );
      }

      setFeedback(
        nextActive
          ? "Igreja reativada com sucesso."
          : "Igreja inativada com sucesso.",
      );
    });
  }

  async function handleChangeUserRole(
    userId: string,
    targetRole: "admin" | "member",
  ) {
    setPromotingUserId(userId);
    setError(null);
    setFeedback(null);

    const response = await fetch(`/api/superadmin/users/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: targetRole }),
    });

    const body = (await response.json()) as {
      profile?: { id: string; role: string };
      error?: string;
    };

    if (!response.ok) {
      setError(body.error || "Erro ao atualizar permissão.");
      setPromotingUserId(null);
      return;
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? { ...user, role: body.profile?.role || targetRole }
          : user,
      ),
    );
    setFeedback(
      targetRole === "admin"
        ? "Usuário promovido para administrador da igreja."
        : "Permissão de administrador removida com sucesso.",
    );
    setPromotingUserId(null);
  }

  async function handleExportMembersReport() {
    if (!selectedChurchId) {
      setError("Selecione uma igreja para exportar o relatório.");
      return;
    }

    setIsExportingReport(true);
    setError(null);
    setFeedback(null);

    const response = await fetch(
      `/api/superadmin/churches/${selectedChurchId}/members-report`,
    );
    const body = (await response.json()) as ChurchMembersReportResponse;

    if (!response.ok) {
      setError(body.error || "Erro ao gerar relatório de membros.");
      setIsExportingReport(false);
      return;
    }

    generateChurchMembersPdf({
      churchName: body.church?.name || selectedChurch?.name || "igreja",
      members: body.members || [],
    });

    setFeedback("Relatório de membros exportado com sucesso.");
    setIsExportingReport(false);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Operação global</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Gestão de igrejas e usuários
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Selecione uma igreja para analisar métricas, ajustar plano e
              pesquisar usuários com contexto administrativo.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/dashboard/superadmin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao dashboard
            </Link>
          </Button>
        </div>
      </section>

      {(feedback || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
          }`}
        >
          {error || feedback}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contexto da igreja
            </CardTitle>
            <CardDescription>
              Base para análise, suporte e mudança de plano.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="church-select">Igreja</Label>
              <Select
                value={selectedChurchId}
                onValueChange={setSelectedChurchId}
              >
                <SelectTrigger id="church-select">
                  <SelectValue placeholder="Selecione uma igreja" />
                </SelectTrigger>
                <SelectContent>
                  {initialChurches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dados da igreja...
              </div>
            ) : churchDetails ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Usuários ativos
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {churchDetails.stats.activeUsers}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Administradores
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {churchDetails.stats.totalAdmins}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Ministérios
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {churchDetails.stats.totalMinistries}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Usuários na igreja
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {churchDetails.stats.totalUsers}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4 sm:col-span-2 xl:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Na igreja sem ministério
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {churchDetails.stats.usersWithoutMinistry}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={churchDetails.church.active ? "default" : "secondary"}>
                        {churchDetails.church.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-background p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                      <Label htmlFor="church-plan">Plano da igreja</Label>
                      <Select
                        value={selectedPlan}
                        onValueChange={setSelectedPlan}
                      >
                        <SelectTrigger
                          id="church-plan"
                          className="w-full md:w-72"
                        >
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 - Somente email</SelectItem>
                          <SelectItem value="1">
                            1 - WhatsApp + notificações
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handlePlanSave} disabled={isSavingPlan}>
                      {isSavingPlan ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar plano"
                      )}
                    </Button>

                    <Button
                      onClick={handleToggleChurchStatus}
                      disabled={isSavingChurchStatus}
                      variant={churchDetails.church.active ? "outline" : "destructive"}
                    >
                      {isSavingChurchStatus ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Atualizando...
                        </>
                      ) : churchDetails.church.active ? (
                        "Inativar"
                      ) : (
                        "Reativar"
                      )}
                    </Button>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Plano atual: {planLabels[Number(selectedPlan)] || "Email"}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                Selecione uma igreja para visualizar os indicadores.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Resumo rápido
            </CardTitle>
            <CardDescription>
              Visão objetiva da igreja atual para suporte imediato.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Igreja selecionada
              </p>
              <p className="mt-2 font-medium text-foreground">
                {selectedChurch?.name || "Nenhuma igreja selecionada"}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Plano vigente
              </p>
              <p className="mt-2 font-medium text-foreground">
                {planLabels[Number(selectedPlan)] || "Email"}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ação disponível
              </p>
              <p className="mt-2 font-medium text-foreground">
                Promover e remover administradores da igreja
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Relatório de membros
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMembersReport}
                  disabled={!selectedChurchId || isExportingReport}
                >
                  {isExportingReport ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar relatório
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Inclui todos os membros da igreja e destaca quem está sem
                ministério.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pesquisar usuários
          </CardTitle>
          <CardDescription>
            Busque por nome ou email. Se uma igreja estiver selecionada, o
            filtro será aplicado nela.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Digite nome ou email"
              className="pl-9"
            />
          </div>

          {isLoadingUsers ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando usuários...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Igreja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => {
                    const isAdmin = user.role === "admin";
                    const isSuperAdmin = user.role === "superadmin";

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{user.churchName || "Sem igreja"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={
                                isSuperAdmin
                                  ? "destructive"
                                  : isAdmin
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {isSuperAdmin
                                ? "Superadmin"
                                : isAdmin
                                  ? "Admin"
                                  : user.role}
                            </Badge>
                            <Badge
                              variant={
                                user.hasMinistry ? "secondary" : "outline"
                              }
                            >
                              {user.hasMinistry
                                ? `${user.ministryCount} ministério(s)`
                                : "Sem ministério"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={isAdmin ? "outline" : "default"}
                            disabled={
                              isSuperAdmin ||
                              (!user.churchId && !isAdmin) ||
                              promotingUserId === user.id
                            }
                            onClick={() =>
                              handleChangeUserRole(
                                user.id,
                                isAdmin ? "member" : "admin",
                              )
                            }
                          >
                            {promotingUserId === user.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : isSuperAdmin ? (
                              "Protegido"
                            ) : !user.churchId ? (
                              "Sem igreja"
                            ) : isAdmin ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Remover admin
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Tornar admin
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {searchTerm.trim().length < 2 && !selectedChurchId
                        ? "Digite ao menos 2 caracteres para pesquisar usuários."
                        : "Nenhum usuário encontrado com os filtros atuais."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
