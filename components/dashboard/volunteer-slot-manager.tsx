"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Trash2, Check, Clock, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VolunteerSlot {
  id: string;
  status: string;
  profiles: { id: string; name: string; email: string } | null;
  ministries: { id: string; name: string; color: string } | null;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
}

interface Ministry {
  id: string;
  name: string;
  color: string;
}

interface VolunteerSlotManagerProps {
  eventId: string;
  eventDate: string;
  slots: VolunteerSlot[];
  volunteers: Volunteer[];
  ministries: Ministry[];
  unavailableIds: string[];
  canManage: boolean;
  isAdmin: boolean;
  ledMinistryIds: string[];
}

export function VolunteerSlotManager({
  eventId,
  eventDate,
  slots,
  volunteers,
  ministries,
  unavailableIds,
  canManage,
  isAdmin,
  ledMinistryIds,
}: VolunteerSlotManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [selectedMinistry, setSelectedMinistry] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Determine if user needs to select ministry or if it's auto-selected
  const needsMinistrySelection = isAdmin || ledMinistryIds.length > 1;
  const autoSelectedMinistry = !needsMinistrySelection && ministries.length === 1 
    ? ministries[0] 
    : null;

  // Separate available and unavailable volunteers
  const availableVolunteers = volunteers.filter(
    (v) => !unavailableIds.includes(v.id)
  );
  const unavailableVolunteersForDate = volunteers.filter((v) =>
    unavailableIds.includes(v.id)
  );

  // Check if user can manage a specific slot based on its ministry
  const canManageSlot = (ministryId: string) => {
    return isAdmin || ledMinistryIds.includes(ministryId);
  };

  async function handleAddSlot() {
    const ministryToUse = autoSelectedMinistry?.id || selectedMinistry;
    if (!selectedVolunteer || !ministryToUse) return;
    setLoading(true);

    await supabase.from("volunteer_slots").insert({
      event_id: eventId,
      user_id: selectedVolunteer,
      ministry_id: ministryToUse,
      status: "pending",
    });

    setLoading(false);
    setOpen(false);
    setSelectedVolunteer("");
    setSelectedMinistry("");
    router.refresh();
  }

  async function handleUpdateStatus(slotId: string, status: string) {
    await supabase.from("volunteer_slots").update({ status }).eq("id", slotId);
    router.refresh();
  }

  async function handleRemoveSlot(slotId: string) {
    await supabase.from("volunteer_slots").delete().eq("id", slotId);
    router.refresh();
  }

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-amber-500" />,
    confirmed: <Check className="h-4 w-4 text-emerald-500" />,
    declined: <X className="h-4 w-4 text-destructive" />,
  };

  const statusLabels = {
    pending: "Pendente",
    confirmed: "Confirmado",
    declined: "Recusado",
  };

  return (
    <div className="space-y-4">
      {slots.length > 0 ? (
        <div className="space-y-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {slot.profiles?.name
                    ? slot.profiles.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "?"}
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    {slot.profiles?.name || "Voluntário não encontrado"}
                  </p>
                  <div className="flex items-center gap-2">
                    {slot.ministries && (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${slot.ministries.color}20`,
                          color: slot.ministries.color,
                        }}
                      >
                        {slot.ministries.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManageSlot(slot.ministries?.id || "") ? (
                  <>
                    <Select
                      value={slot.status}
                      onValueChange={(value) => handleUpdateStatus(slot.id, value)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <div className="flex items-center gap-2">
                          {statusIcons[slot.status as keyof typeof statusIcons]}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Pendente
                          </div>
                        </SelectItem>
                        <SelectItem value="confirmed">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-500" />
                            Confirmado
                          </div>
                        </SelectItem>
                        <SelectItem value="declined">
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-destructive" />
                            Recusado
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveSlot(slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {statusIcons[slot.status as keyof typeof statusIcons]}
                    <span>{statusLabels[slot.status as keyof typeof statusLabels]}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-4">
          Nenhum voluntário escalado para este evento.
        </p>
      )}

      {canManage && ministries.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Voluntario
            </Button>
          </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Voluntário à Escala</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Voluntário *</Label>
              <Select
                value={selectedVolunteer}
                onValueChange={setSelectedVolunteer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um voluntário" />
                </SelectTrigger>
                <SelectContent>
                  {availableVolunteers.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-emerald-600">
                        Disponiveis ({availableVolunteers.length})
                      </div>
                      {availableVolunteers.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {v.name}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {unavailableVolunteersForDate.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-destructive mt-2">
                        Indisponiveis ({unavailableVolunteersForDate.length})
                      </div>
                      {unavailableVolunteersForDate.map((v) => (
                        <SelectItem
                          key={v.id}
                          value={v.id}
                          className="text-muted-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                            {v.name}
                            <span className="text-xs">(indisponivel)</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {selectedVolunteer &&
                unavailableIds.includes(selectedVolunteer) && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Este voluntario esta marcado como indisponivel nesta data.
                  </div>
                )}
            </div>

            {needsMinistrySelection ? (
              <div className="space-y-2">
                <Label>Ministerio *</Label>
                <Select
                  value={selectedMinistry}
                  onValueChange={setSelectedMinistry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ministerio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: m.color }}
                          />
                          {m.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : autoSelectedMinistry && (
              <div className="space-y-2">
                <Label>Ministerio</Label>
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: autoSelectedMinistry.color }}
                  />
                  {autoSelectedMinistry.name}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleAddSlot}
              disabled={!selectedVolunteer || (!autoSelectedMinistry && !selectedMinistry) || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar à Escala"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {!canManage && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Apenas administradores e lideres dos ministerios podem gerenciar a escala.
        </p>
      )}
    </div>
  );
}
