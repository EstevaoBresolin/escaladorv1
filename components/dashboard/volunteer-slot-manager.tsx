"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
import {
  Plus,
  Loader2,
  Trash2,
  Check,
  Clock,
  X,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VolunteerSlot {
  id: string;
  status: string;
  profiles: { id: string; name: string; email: string } | null;
  ministries: { id: string; name: string; color: string } | null;
  ministry_functions: { id: string; name: string } | null;
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

interface MinistryFunction {
  id: string;
  name: string;
}

interface VolunteerSlotManagerProps {
  eventId: string;
  eventDate: string;
  eventStartTime?: string;
  slots: VolunteerSlot[];
  volunteers: Volunteer[];
  ministries: Ministry[];
  unavailableData?: Array<{
    user_id: string;
    unavailable_date: string;
    period: string;
  }>;
  unavailableIds?: string[];
  canManage: boolean;
  isAdmin: boolean;
  ledMinistryIds: string[];
}

export function VolunteerSlotManager({
  eventId,
  eventDate,
  eventStartTime,
  slots,
  volunteers,
  ministries,
  unavailableData = [],
  unavailableIds = [],
  canManage,
  isAdmin,
  ledMinistryIds,
}: VolunteerSlotManagerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState("");
  const [selectedMinistry, setSelectedMinistry] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("");
  const [ministryFunctions, setMinistryFunctions] = useState<
    MinistryFunction[]
  >([]);
  const [functionsLoading, setFunctionsLoading] = useState(false);
  const [volunteerAvailabilityCount, setVolunteerAvailabilityCount] = useState<
    Record<string, number>
  >({});
  const [volunteerEventCount, setVolunteerEventCount] = useState<
    Record<string, number>
  >({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Determine if user needs to select ministry or if it's auto-selected
  const needsMinistrySelection = isAdmin || ledMinistryIds.length > 1;
  const autoSelectedMinistry =
    !needsMinistrySelection && ministries.length === 1 ? ministries[0] : null;
  const selectedMinistryId = autoSelectedMinistry?.id || selectedMinistry;

  // Separate available and unavailable volunteers
  const availableVolunteers = volunteers.filter(
    (v) => !isVolunteerUnavailable(v.id),
  );

  // Sort available volunteers by priority (least available dates first = highest priority)
  const sortedAvailableVolunteers = [...availableVolunteers].sort((a, b) => {
    const availCountA = volunteerAvailabilityCount[a.id] ?? Infinity;
    const availCountB = volunteerAvailabilityCount[b.id] ?? Infinity;

    // Primary sort: lower availability count = higher priority (appears first)
    if (availCountA !== Infinity && availCountB !== Infinity) {
      if (availCountA !== availCountB) {
        return availCountA - availCountB;
      }
    }

    // Secondary sort: if availability is equal, prioritize those with fewer scheduled events
    const eventCountA = volunteerEventCount[a.id] ?? 0;
    const eventCountB = volunteerEventCount[b.id] ?? 0;
    if (eventCountA !== eventCountB) {
      return eventCountA - eventCountB;
    }

    // Tertiary sort: alphabetical by name
    return (a.name || "").localeCompare(b.name || "");
  });

  // Check if user can manage a specific slot based on its ministry
  const canManageSlot = (ministryId: string) => {
    return isAdmin || ledMinistryIds.includes(ministryId);
  };

  // Helper to get event period based on start time
  function getEventPeriod(startTime?: string): string {
    if (!startTime) return "all_day";
    const [hours] = startTime.split(":").map(Number);
    if (hours >= 6 && hours < 12) return "morning";
    if (hours >= 12 && hours < 18) return "afternoon";
    return "evening";
  }

  // Check if volunteer is unavailable considering time period
  function isVolunteerUnavailable(volunteerId: string): boolean {
    const eventPeriod = getEventPeriod(eventStartTime);
    return unavailableData.some((u) => {
      if (u.user_id !== volunteerId || u.unavailable_date !== eventDate) {
        return false;
      }
      // If unavailable all day, definitely unavailable
      if (u.period === "all_day") return true;
      // If specific period unavailable matches event period, unavailable
      if (u.period === eventPeriod) return true;
      return false;
    });
  }

  useEffect(() => {
    if (!open) return;

    // Load volunteer availability and event count data
    loadVolunteerPriorityData();
  }, [open]);

  async function loadVolunteerPriorityData() {
    setAvailabilityLoading(true);
    const availabilityMap: Record<string, number> = {};
    const eventCountMap: Record<string, number> = {};

    // Count how many different dates each volunteer is available
    const availableDates = new Set<string>();
    const now = new Date();

    // Check next 30 days
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      availableDates.add(dateStr);
    }

    for (const volunteer of volunteers) {
      let availableDateCount = 0;

      // Count dates where volunteer is available
      availableDates.forEach((dateStr) => {
        const isUnavailable = unavailableData.some(
          (u) => u.user_id === volunteer.id && u.unavailable_date === dateStr,
        );
        if (!isUnavailable) {
          availableDateCount++;
        }
      });

      availabilityMap[volunteer.id] = availableDateCount;

      // Count how many events volunteer is already scheduled for
      const eventCount = slots.filter(
        (slot) => slot.profiles?.id === volunteer.id,
      ).length;
      eventCountMap[volunteer.id] = eventCount;
    }

    setVolunteerAvailabilityCount(availabilityMap);
    setVolunteerEventCount(eventCountMap);
    setAvailabilityLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    if (!selectedMinistryId) {
      setMinistryFunctions([]);
      setSelectedFunction("");
      return;
    }

    let active = true;

    async function loadFunctions() {
      setFunctionsLoading(true);
      const { data } = await supabase
        .from("ministry_functions")
        .select("id, name")
        .eq("ministry_id", selectedMinistryId)
        .order("name");

      if (active) {
        setMinistryFunctions(data || []);
        setSelectedFunction("");
        setFunctionsLoading(false);
      }
    }

    loadFunctions();

    return () => {
      active = false;
    };
  }, [open, selectedMinistryId, supabase]);

  async function handleAddSlot() {
    const ministryToUse = selectedMinistryId;
    const hasFunctions = ministryFunctions.length > 0;
    if (!selectedVolunteer || !ministryToUse) return;
    if (!hasFunctions) return;
    if (hasFunctions && !selectedFunction) return;
    setLoading(true);

    await supabase.from("volunteer_slots").insert({
      event_id: eventId,
      user_id: selectedVolunteer,
      ministry_id: ministryToUse,
      function_id: selectedFunction || null,
      status: "confirmed",
    });

    setLoading(false);
    setOpen(false);
    setSelectedVolunteer("");
    setSelectedMinistry("");
    setSelectedFunction("");
    router.refresh();
  }

  async function handleRemoveSlot(slotId: string) {
    await supabase.from("volunteer_slots").delete().eq("id", slotId);
    router.refresh();
  }

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
                    {slot.ministry_functions && (
                      <Badge variant="secondary">
                        {slot.ministry_functions.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManageSlot(slot.ministries?.id || "") ? (
                  <>
                    <Badge variant="default">
                      <Check className="h-3 w-3 mr-1" />
                      Escalado
                    </Badge>
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
                  <Badge variant="default">
                    <Check className="h-3 w-3 mr-1" />
                    Escalado
                  </Badge>
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
                    {sortedAvailableVolunteers.length > 0 ? (
                      <>
                        {sortedAvailableVolunteers.map((v) => {
                          const availableCount =
                            volunteerAvailabilityCount[v.id];
                          const eventCount = volunteerEventCount[v.id];
                          const isCritical = availableCount
                            ? availableCount <= 5
                            : false;

                          let priorityNote = "";
                          if (
                            availableCount !== undefined &&
                            eventCount !== undefined
                          ) {
                            if (availableCount <= 5) {
                              priorityNote = ` (${availableCount} dias · ${eventCount} eventos)`;
                            } else {
                              priorityNote = ` (${eventCount} eventos)`;
                            }
                          }

                          return (
                            <SelectItem key={v.id} value={v.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    isCritical ? "bg-red-500" : "bg-emerald-500"
                                  }`}
                                />
                                {v.name}
                                {priorityNote && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {priorityNote}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </>
                    ) : (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Nenhum voluntário disponível para este horário
                      </div>
                    )}
                  </SelectContent>
                </Select>
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
              ) : (
                autoSelectedMinistry && (
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
                )
              )}

              {selectedMinistryId && (
                <div className="space-y-2">
                  <Label>
                    Função {ministryFunctions.length > 0 ? "*" : ""}
                  </Label>
                  {functionsLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Carregando funções...
                    </p>
                  ) : ministryFunctions.length > 0 ? (
                    <Select
                      value={selectedFunction}
                      onValueChange={setSelectedFunction}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                      <SelectContent>
                        {ministryFunctions.map((fn) => (
                          <SelectItem key={fn.id} value={fn.id}>
                            {fn.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma função cadastrada para este ministério.
                    </p>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleAddSlot}
                disabled={
                  !selectedVolunteer ||
                  (!autoSelectedMinistry && !selectedMinistry) ||
                  (ministryFunctions.length === 0 && !functionsLoading) ||
                  (ministryFunctions.length > 0 && !selectedFunction) ||
                  functionsLoading ||
                  loading
                }
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
          Apenas administradores e lideres dos ministerios podem gerenciar a
          escala.
        </p>
      )}
    </div>
  );
}
