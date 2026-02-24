"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Mail,
  Phone,
  MoreVertical,
  Search,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-feedback";

interface UserMinistry {
  ministry_id: string;
  ministries: { name: string; color: string };
}

interface Volunteer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  user_ministries?: UserMinistry[];
}

export default function VoluntariosPage() {
  const supabase = useMemo(() => createClient(), []);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [churchId, setChurchId] = useState<string>("");
  const [ledMinistryIds, setLedMinistryIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchPermissions() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: profile }, { data: ledMinistries }] = await Promise.all([
        supabase
          .from("profiles")
          .select("church_id, role")
          .eq("id", user.id)
          .single(),
        supabase
          .from("ministry_leaders")
          .select("ministry_id")
          .eq("user_id", user.id),
      ]);

      const isAdminUser = profile?.role === "admin";
      const ministryIds = (ledMinistries || []).map((m) => m.ministry_id);

      setIsAdmin(isAdminUser);
      setIsLeader(ministryIds.length > 0);
      setChurchId(profile?.church_id || "");
      setLedMinistryIds(ministryIds);
      setCurrentUserId(user.id);
      setLoading(false);
    }

    fetchPermissions();
  }, [supabase]);

  useEffect(() => {
    if (!churchId) return;

    const term = searchTerm.trim();

    if (!term) {
      setVolunteers([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoadingSearch(true);

      const selectColumns = `
            *,
            user_ministries(ministry_id, ministries(name, color))
          `;

      const queryByName = () => {
        if (isAdmin) {
          return supabase
            .from("profiles")
            .select(selectColumns)
            .eq("church_id", churchId)
            .ilike("name", `%${term}%`)
            .order("name")
            .limit(50);
        }

        return supabase
          .from("profiles")
          .select(
            `
              *,
              user_ministries!inner(ministry_id, ministries(name, color))
            `,
          )
          .eq("church_id", churchId)
          .in("user_ministries.ministry_id", ledMinistryIds)
          .ilike("name", `%${term}%`)
          .order("name")
          .limit(50);
      };

      const queryByEmail = () => {
        if (isAdmin) {
          return supabase
            .from("profiles")
            .select(selectColumns)
            .eq("church_id", churchId)
            .ilike("email", `%${term}%`)
            .order("name")
            .limit(50);
        }

        return supabase
          .from("profiles")
          .select(
            `
              *,
              user_ministries!inner(ministry_id, ministries(name, color))
            `,
          )
          .eq("church_id", churchId)
          .in("user_ministries.ministry_id", ledMinistryIds)
          .ilike("email", `%${term}%`)
          .order("name")
          .limit(50);
      };

      const [{ data: nameMatches }, { data: emailMatches }] = await Promise.all(
        [queryByName(), queryByEmail()],
      );

      const byId = new Map<string, Volunteer>();
      (
        [...(nameMatches || []), ...(emailMatches || [])] as Volunteer[]
      ).forEach((volunteer) => {
        if (volunteer?.id) {
          byId.set(volunteer.id, volunteer);
        }
      });

      const result = Array.from(byId.values()).sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );

      setVolunteers(result);
      setLoadingSearch(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [churchId, isAdmin, ledMinistryIds, searchTerm, supabase]);

  const filteredVolunteers = volunteers;

  const subtitle = isAdmin
    ? "Gerencie os voluntários da sua igreja"
    : isLeader
      ? "Voluntários dos ministérios que você lidera"
      : "Voluntários";

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        </section>

        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contato
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Ministérios
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              Gestão de pessoas
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Voluntários
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>{filteredVolunteers.length} resultados</span>
          </div>
        </div>
      </section>

      <Card className="rounded-2xl">
        <CardContent className="p-4 md:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar voluntários por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loadingSearch && searchTerm.trim() && (
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Buscando voluntários...
          </CardContent>
        </Card>
      )}

      {filteredVolunteers.length > 0 ? (
        <Card className="overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contato
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Ministérios
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolunteers.map((volunteer) => (
                  <TableRow key={volunteer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {volunteer.name
                            ? volunteer.name
                                .split(" ")
                                .map((name: string) => name[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            : "?"}
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">
                            {volunteer.name || "Sem nome"}
                          </p>
                          <p className="text-sm text-muted-foreground md:hidden">
                            {volunteer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1">
                        {volunteer.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {volunteer.email}
                          </div>
                        )}
                        {volunteer.phone &&
                          (isAdmin || currentUserId === volunteer.id) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {volunteer.phone}
                            </div>
                          )}
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {volunteer.user_ministries &&
                        volunteer.user_ministries.length > 0 ? (
                          volunteer.user_ministries.map((userMinistry) => (
                            <span
                              key={userMinistry.ministry_id}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `${userMinistry.ministries.color}20`,
                                color: userMinistry.ministries.color,
                              }}
                            >
                              {userMinistry.ministries.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Nenhum ministério
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/voluntarios/${volunteer.id}`}
                            >
                              Ver perfil
                            </Link>
                          </DropdownMenuItem>
                          {(isAdmin || currentUserId === volunteer.id) && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/voluntarios/${volunteer.id}/editar`}
                              >
                                Editar
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : searchTerm.trim() ? (
        <DashboardEmptyState
          icon={Search}
          title="Nenhum voluntário encontrado"
          description={`Não encontramos nenhum voluntário com o termo "${searchTerm}".`}
          action={
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Limpar pesquisa
            </Button>
          }
        />
      ) : (
        <DashboardEmptyState
          icon={Search}
          title="Digite para buscar voluntários"
          description="A listagem é carregada somente após pesquisar por nome ou email."
        />
      )}
    </div>
  );
}
