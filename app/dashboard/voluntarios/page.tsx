import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, Phone, MoreVertical } from "lucide-react";
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
import { getUserPermissions } from "@/lib/permissions";

export default async function VoluntariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", user?.id)
    .single();

  // Get user permissions
  const permissions = await getUserPermissions(supabase);
  const isAdmin = permissions?.isAdmin || false;
  const currentUserId = user?.id;

  const { data: volunteers } = await supabase
    .from("profiles")
    .select(
      `
      *,
      user_ministries(ministry_id, ministries(name, color))
    `,
    )
    .eq("church_id", profile?.church_id)
    .order("name");

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

      {volunteers && volunteers.length > 0 ? (
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
                {volunteers.map((volunteer) => (
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
                          volunteer.user_ministries.map(
                            (um: {
                              ministry_id: string;
                              ministries: { name: string; color: string };
                            }) => (
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
                            ),
                          )
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
