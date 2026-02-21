"use client";

import { useState } from "react";
import { dbQuery } from "@/lib/api/db-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, UserPlus, ChevronsUpDown } from "lucide-react";
import { VolunteerSearch } from "./volunteer-search";

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
  availableVolunteers: Volunteer[];
}

export function MinistryVolunteerManager({
  ministryId,
  members,
  availableVolunteers,
}: MinistryVolunteerManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");

  // Filter out volunteers already in the ministry
  const memberIds = members.map((m) => m.profiles?.id).filter(Boolean);
  const filteredVolunteers = availableVolunteers.filter(
    (v) => !memberIds.includes(v.id),
  );

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
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
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
                <div>
                  <p className="font-medium text-card-foreground">
                    {member.profiles?.name || "Voluntário não encontrado"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.profiles?.email}
                  </p>
                </div>
              </div>
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
            {filteredVolunteers.length > 0 ? (
              <>
                <VolunteerSearch
                  volunteers={filteredVolunteers}
                  selectedVolunteerId={selectedVolunteer}
                  onSelectVolunteer={setSelectedVolunteer}
                  showEventStats={false}
                />

                <Button
                  className="w-full"
                  onClick={handleAddVolunteer}
                  disabled={!selectedVolunteer || loading}
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
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Todos os voluntários já estão neste ministério.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
