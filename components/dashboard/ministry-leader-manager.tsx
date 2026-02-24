"use client";

import { useEffect, useMemo, useState } from "react";
import { dbQuery } from "@/lib/api/db-client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VolunteerSearch } from "./volunteer-search";

interface Leader {
  id: string;
  user_id: string;
  profiles: { id: string; name: string; email: string } | null;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
}

interface MinistryLeaderManagerProps {
  ministryId: string;
  leaders: Leader[];
  churchId: string;
  isAdmin: boolean;
}

export function MinistryLeaderManager({
  ministryId,
  leaders,
  churchId,
  isAdmin,
}: MinistryLeaderManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteVolunteers, setRemoteVolunteers] = useState<Volunteer[]>([]);
  const supabase = useMemo(() => createClient(), []);

  const leaderIds = useMemo(
    () => new Set(leaders.map((l) => l.profiles?.id).filter(Boolean)),
    [leaders],
  );

  const selectableVolunteers = useMemo(
    () => remoteVolunteers.filter((v) => !leaderIds.has(v.id)),
    [remoteVolunteers, leaderIds],
  );

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(async () => {
      setLoadingVolunteers(true);

      let query = supabase
        .from("profiles")
        .select("id, name, email")
        .eq("church_id", churchId)
        .order("name")
        .limit(30);

      const term = searchTerm.trim();
      if (term) {
        query = query.ilike("name", `%${term}%`);
      }

      const { data } = await query;
      const volunteers = (data || []).map((v: any) => ({
        id: v.id,
        name: v.name || v.email,
        email: v.email || "",
      }));

      setRemoteVolunteers(volunteers);
      setLoadingVolunteers(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [open, searchTerm, churchId, supabase]);

  async function handleAddLeader() {
    if (!selectedVolunteer) return;
    setLoading(true);

    try {
      await dbQuery({
        table: "ministry_leaders",
        action: "insert",
        values: {
          ministry_id: ministryId,
          user_id: selectedVolunteer,
        },
      });

      setOpen(false);
      setSelectedVolunteer("");
      setSearchTerm("");
      setRemoteVolunteers([]);
      window.location.reload();
    } catch {
      // mantém UX atual sem toast adicional
    }

    setLoading(false);
  }

  async function handleRemoveLeader(leaderId: string) {
    setRemovingId(leaderId);
    await dbQuery({
      table: "ministry_leaders",
      action: "delete",
      filters: [{ field: "id", operator: "eq", value: leaderId }],
    });
    setRemovingId(null);
    window.location.reload();
  }

  // Only admins can manage leaders
  if (!isAdmin) {
    return (
      <div className="space-y-4">
        {leaders.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto] gap-4 border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
              <p>Nome</p>
              <p>Contato</p>
              <p>Papel</p>
            </div>
            {leaders.map((leader) => (
              <div
                key={leader.id}
                className="grid gap-3 border-t border-border px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-sm font-medium text-amber-600">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-card-foreground">
                      {leader.profiles?.name || "Lider nao encontrado"}
                    </p>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm text-muted-foreground">
                    {leader.profiles?.email || "-"}
                  </p>
                </div>

                <Badge
                  variant="secondary"
                  className="w-fit shrink-0 bg-amber-500/10 text-amber-600"
                >
                  Lider
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Crown className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Nenhum lider designado para este ministerio.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leaders.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto_auto] gap-4 border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <p>Nome</p>
            <p>Contato</p>
            <p>Papel</p>
            <span className="sr-only">Ações</span>
          </div>
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="grid gap-3 border-t border-border px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto_auto] md:items-center md:gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-sm font-medium text-amber-600">
                  <Crown className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-card-foreground">
                    {leader.profiles?.name || "Lider nao encontrado"}
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">
                  {leader.profiles?.email || "-"}
                </p>
              </div>

              <Badge
                variant="secondary"
                className="w-fit shrink-0 bg-amber-500/10 text-amber-600"
              >
                Lider
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveLeader(leader.id)}
                disabled={removingId === leader.id}
              >
                {removingId === leader.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">Remover</span>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Crown className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Nenhum lider designado para este ministerio.
          </p>
          <p className="text-sm text-muted-foreground">
            Adicione lideres para gerenciar os voluntarios.
          </p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Lider
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Lider ao Ministerio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <VolunteerSearch
              volunteers={remoteVolunteers}
              selectedVolunteerId={selectedVolunteer}
              onSelectVolunteer={setSelectedVolunteer}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              loading={loadingVolunteers}
              showEventStats={false}
              disabledVolunteerIds={Array.from(leaderIds) as string[]}
              disabledBadgeText="Já é líder"
            />

            {remoteVolunteers.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                {loadingVolunteers
                  ? "Carregando voluntários..."
                  : "Nenhum voluntário encontrado com os filtros atuais."}
              </p>
            )}

            {remoteVolunteers.length > 0 && selectableVolunteers.length === 0 && (
              <p className="text-center text-muted-foreground py-2 text-sm">
                Todos os resultados já são líderes deste ministério.
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              Lideres podem adicionar e remover voluntarios do ministerio e
              escalar voluntarios para eventos.
            </p>

            <Button
              className="w-full"
              onClick={handleAddLeader}
              disabled={!selectedVolunteer || leaderIds.has(selectedVolunteer) || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar como Lider"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
