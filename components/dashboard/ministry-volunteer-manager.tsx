"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dbQuery } from "@/lib/api/db-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, UserPlus } from "lucide-react";
import { VolunteerSearch } from "./volunteer-search";
import { Input } from "@/components/ui/input";

export interface Volunteer {
  id: string;
  name: string;
  email: string;
}

interface MinistryMember {
  id: string;
  profiles: { id: string; name: string; email: string } | null;
}

interface MinistryVolunteerManagerProps {
  ministryId: string;
  members: MinistryMember[];
  churchId: string;
}

export function MinistryVolunteerManager({
  ministryId,
  members,
  churchId,
}: MinistryVolunteerManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [remoteVolunteers, setRemoteVolunteers] = useState<Volunteer[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.profiles?.id).filter(Boolean)),
    [members],
  );

  const selectableVolunteers = useMemo(
    () => remoteVolunteers.filter((v) => !memberIds.has(v.id)),
    [remoteVolunteers, memberIds],
  );

  const filteredMembers = useMemo(() => {
    const term = memberSearchTerm.trim().toLowerCase();
    if (!term) return members;

    return members.filter((member) => {
      const name = member.profiles?.name?.toLowerCase() || "";
      const email = member.profiles?.email?.toLowerCase() || "";
      return name.includes(term) || email.includes(term);
    });
  }, [members, memberSearchTerm]);

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

  async function handleAddVolunteer() {
    if (!selectedVolunteer) return;
    setLoading(true);

    try {
      await dbQuery({
        table: "user_ministries",
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

  async function handleRemoveVolunteer(membershipId: string) {
    setRemovingId(membershipId);
    await dbQuery({
      table: "user_ministries",
      action: "delete",
      filters: [{ field: "id", operator: "eq", value: membershipId }],
    });
    setRemovingId(null);
    // Forçar re-render apenas quando necessário
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {members.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="border-b border-border bg-background p-3">
            <Input
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              placeholder="Buscar voluntário do ministério"
            />
          </div>
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto] gap-4 border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <p>Nome</p>
            <p>Contato</p>
            <span className="sr-only">Ações</span>
          </div>
          <div className="max-h-[440px] overflow-y-auto">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="grid gap-3 border-t border-border px-4 py-3 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {member.profiles?.name
                      ? member.profiles.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-card-foreground">
                      {member.profiles?.name || "Voluntário não encontrado"}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {member.profiles?.email || "-"}
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveVolunteer(member.id)}
                  disabled={removingId === member.id}
                >
                  {removingId === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Remover</span>
                </Button>
              </div>
            ))}

            {filteredMembers.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhum voluntário encontrado nessa busca.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <UserPlus className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            Nenhum voluntário neste ministério.
          </p>
          <p className="text-sm text-muted-foreground">
            Adicione voluntários para começar.
          </p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Voluntário
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Voluntário ao Ministério</DialogTitle>
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
              disabledVolunteerIds={Array.from(memberIds) as string[]}
              disabledBadgeText="Já no ministério"
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
                Todos os resultados já fazem parte deste ministério.
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleAddVolunteer}
              disabled={!selectedVolunteer || memberIds.has(selectedVolunteer) || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar ao Ministério"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
