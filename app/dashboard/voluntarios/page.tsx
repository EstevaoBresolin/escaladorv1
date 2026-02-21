"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Mail, Phone, MoreVertical, Search } from "lucide-react";
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
import { getUserPermissionsByProfile } from "@/lib/permissions";

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
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id, role")
        .eq("id", user.id)
        .single();

      // Get user permissions
      const permissions = await getUserPermissionsByProfile(
        supabase,
        user.id,
        profile?.role,
      );
      setIsAdmin(permissions?.isAdmin || false);
      setCurrentUserId(user.id);

      const { data: volunteersData } = await supabase
        .from("profiles")
        .select(
          `
          *,
          user_ministries(ministry_id, ministries(name, color))
        `,
        )
        .eq("church_id", profile?.church_id)
        .order("name");

      setVolunteers(volunteersData || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredVolunteers = useMemo(() => {
    if (!searchTerm.trim()) return volunteers;

    const term = searchTerm.toLowerCase().trim();
    return volunteers.filter((volunteer) => {
      // Search by name
      if (volunteer.name && volunteer.name.toLowerCase().includes(term)) {
        return true;
      }

      // Search by email
      if (volunteer.email && volunteer.email.toLowerCase().includes(term)) {
        return true;
      }

      // Search by ministry names
      if (volunteer.user_ministries && volunteer.user_ministries.length > 0) {
        return volunteer.user_ministries.some((um) =>
          um.ministries.name.toLowerCase().includes(term),
        );
      }

      return false;
    });
  }, [volunteers, searchTerm]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Voluntários</h1>
            <p className="text-muted-foreground">
              Gerencie os voluntários da sua igreja
            </p>
          </div>
        </div>
        <Card>
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
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-muted rounded-full animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="h-3 bg-muted rounded w-40 animate-pulse"></div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="h-3 bg-muted rounded w-20 animate-pulse"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Voluntários</h1>
          <p className="text-muted-foreground">
            Gerencie os voluntários da sua igreja
          </p>
        </div>
      </div>

      {volunteers && volunteers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar voluntários por nome, email ou ministério..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {filteredVolunteers && filteredVolunteers.length > 0 ? (
        <Card>
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
                                .map((n: string) => n[0])
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
                          volunteer.user_ministries.map((um) => (
                            <span
                              key={um.ministry_id}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `${um.ministries.color}20`,
                                color: um.ministries.color,
                              }}
                            >
                              {um.ministries.name}
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
      ) : volunteers && volunteers.length > 0 && searchTerm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Nenhum voluntário encontrado
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              Não encontramos nenhum voluntário com o termo "{searchTerm}".
            </p>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Limpar pesquisa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold text-card-foreground">
              Nenhum voluntário cadastrado
            </h3>
            <p className="text-center text-muted-foreground">
              Os voluntários são criados através do cadastro (sign up).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
