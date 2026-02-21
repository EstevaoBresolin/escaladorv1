"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventWithMinistries {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
  event_ministries: Array<{
    ministry_id: string;
    ministries: { id: string; name: string; color: string };
  }>;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
}

interface Slot {
  id: string;
  user_id: string;
  ministry_id: string | null;
  ministry_functions: { id: string; name: string } | null;
  profiles: { id: string; name: string; email: string } | null;
}

interface MinistryFunction {
  id: string;
  name: string;
}

interface Unavailability {
  user_id: string;
  unavailable_date: string;
  period: string;
}

interface EventQuickScheduleProps {
  event: EventWithMinistries;
  isAdmin: boolean;
  ledMinistryIds: string[];
  triggerSize?: "default" | "sm" | "lg";
  triggerClassName?: string;
}

export function EventQuickSchedule({
  event,
  isAdmin,
  ledMinistryIds,
  triggerSize = "default",
  triggerClassName,
}: EventQuickScheduleProps) {
  const [open, setOpen] = useState(false);
  const [selectMinistryOpen, setSelectMinistryOpen] = useState(false);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>("");
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>(
    [],
  );
  const [conflictingVolunteerIds, setConflictingVolunteerIds] = useState<
    string[]
  >([]);
  const [volunteerAvailabilityCount, setVolunteerAvailabilityCount] = useState<
    Record<string, number>
  >({});
  const [volunteerEventCount, setVolunteerEventCount] = useState<
    Record<string, number>
  >({});
  const [monthlyEventsCount, setMonthlyEventsCount] = useState(0);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [functionModalOpen, setFunctionModalOpen] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("");
  const [functions, setFunctions] = useState<MinistryFunction[]>([]);
  const [functionsLoading, setFunctionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const manageableMinistries = useMemo(() => {
    return (event.event_ministries || [])
      .filter((em) => isAdmin || ledMinistryIds.includes(em.ministry_id))
      .map((em) => ({
        id: em.ministry_id,
        name: em.ministries.name,
        color: em.ministries.color,
      }));
  }, [event.event_ministries, isAdmin, ledMinistryIds]);

  const needsMinistrySelection = useMemo(() => {
    if (manageableMinistries.length <= 1) return false;
    return isAdmin || ledMinistryIds.length > 1;
  }, [manageableMinistries.length, isAdmin, ledMinistryIds.length]);

  const autoSelectedMinistry = useMemo(() => {
    if (needsMinistrySelection) return null;
    return manageableMinistries.length === 1 ? manageableMinistries[0] : null;
  }, [manageableMinistries, needsMinistrySelection]);

  const activeMinistryId = autoSelectedMinistry?.id || selectedMinistryId;

  useEffect(() => {
    if (!open) return;

    setError(null);
    setSearch("");
    setSelectedVolunteerId("");
    setSelectedFunctionId("");
    setFunctions([]);

    if (autoSelectedMinistry?.id) {
      setSelectedMinistryId(autoSelectedMinistry.id);
    } else if (!needsMinistrySelection && manageableMinistries.length > 0) {
      setSelectedMinistryId(manageableMinistries[0].id);
    } else {
      setSelectedMinistryId("");
    }

    loadEventSlotsAndUnavailability();
  }, [
    open,
    autoSelectedMinistry,
    manageableMinistries,
    needsMinistrySelection,
  ]);

  useEffect(() => {
    if (!open) return;
    if (!activeMinistryId) return;

    loadVolunteersForMinistry(activeMinistryId);
    loadFunctionsForMinistry(activeMinistryId);
  }, [open, activeMinistryId]);

  useEffect(() => {
    if (!open) return;
    if (!activeMinistryId) return;
    if (volunteers.length === 0) return;

    loadVolunteerPriorityData();
  }, [open, activeMinistryId, volunteers]);

  function getEventPeriod(startTime?: string | null): string {
    if (!startTime) return "all_day";
    const [hours] = startTime.split(":").map(Number);
    if (hours >= 6 && hours < 12) return "morning";
    if (hours >= 12 && hours < 18) return "afternoon";
    return "evening";
  }

  function isVolunteerUnavailable(volunteerId: string): boolean {
    const eventPeriod = getEventPeriod(event.start_time);
    return unavailabilities.some((u) => {
      if (u.user_id !== volunteerId || u.unavailable_date !== event.date) {
        return false;
      }
      if (u.period === "all_day") return true;
      if (u.period === eventPeriod) return true;
      return false;
    });
  }

  const filteredVolunteers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return volunteers
      .filter((v) => {
        const slot = getSlotForVolunteer(v.id);
        if (!slot) return true;
        return slot.ministry_id === activeMinistryId;
      })
      .filter((v) => !conflictingVolunteerIds.includes(v.id))
      .filter((v) => !isVolunteerUnavailable(v.id))
      .filter((v) => {
        if (!term) return true;
        return (
          v.name.toLowerCase().includes(term) ||
          v.email.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const availCountA = volunteerAvailabilityCount[a.id] ?? Infinity;
        const availCountB = volunteerAvailabilityCount[b.id] ?? Infinity;

        if (availCountA === 1 && availCountB !== 1) return -1;
        if (availCountB === 1 && availCountA !== 1) return 1;
        const eventCountA = volunteerEventCount[a.id] ?? Infinity;
        const eventCountB = volunteerEventCount[b.id] ?? Infinity;

        if (eventCountA !== eventCountB) {
          return eventCountA - eventCountB;
        }

        return a.name.localeCompare(b.name);
      });
  }, [
    volunteers,
    search,
    unavailabilities,
    event.date,
    event.start_time,
    slots,
    conflictingVolunteerIds,
    activeMinistryId,
    volunteerAvailabilityCount,
    volunteerEventCount,
  ]);

  async function loadEventSlotsAndUnavailability() {
    setLoading(true);

    let conflictsQuery = supabase
      .from("volunteer_slots")
      .select("user_id, events!inner(id, date, start_time)")
      .eq("events.date", event.date)
      .neq("event_id", event.id);

    if (event.start_time) {
      conflictsQuery = conflictsQuery.eq("events.start_time", event.start_time);
    } else {
      conflictsQuery = conflictsQuery.is("events.start_time", null);
    }

    const [
      { data: slotsData },
      { data: unavailabilityData },
      { data: conflictsData },
    ] = await Promise.all([
      supabase
        .from("volunteer_slots")
        .select(
          "id, user_id, ministry_id, profiles(id, name, email), ministry_functions(id, name)",
        )
        .eq("event_id", event.id),
      supabase
        .from("volunteer_unavailability")
        .select("user_id, unavailable_date, period")
        .eq("unavailable_date", event.date),
      conflictsQuery,
    ]);

    const normalizedSlots = (slotsData || []).map((slot: any) => ({
      id: slot.id,
      user_id: slot.user_id,
      ministry_id: slot.ministry_id,
      profiles: Array.isArray(slot.profiles) ? slot.profiles[0] : slot.profiles,
      ministry_functions: Array.isArray(slot.ministry_functions)
        ? slot.ministry_functions[0]
        : slot.ministry_functions,
    }));

    setSlots(normalizedSlots);
    setUnavailabilities(unavailabilityData || []);
    const conflictIds = (conflictsData || [])
      .map((item: any) => item.user_id)
      .filter(Boolean);
    setConflictingVolunteerIds(Array.from(new Set(conflictIds)));
    setLoading(false);
  }

  async function loadVolunteersForMinistry(ministryId: string) {
    setVolunteerLoading(true);
    const { data } = await supabase
      .from("user_ministries")
      .select("user_id, profiles(id, name, email)")
      .eq("ministry_id", ministryId);

    const list = (data || [])
      .map((item: any) => item.profiles)
      .filter(Boolean)
      .map((p: any) => ({ id: p.id, name: p.name, email: p.email }));

    setVolunteers(list);
    setVolunteerLoading(false);
  }

  async function loadVolunteerPriorityData() {
    setPriorityLoading(true);

    const volunteerIds = volunteers.map((v) => v.id);
    if (volunteerIds.length === 0) {
      setVolunteerAvailabilityCount({});
      setVolunteerEventCount({});
      setMonthlyEventsCount(0);
      setPriorityLoading(false);
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDateStr = `${startDate.getFullYear()}-${String(
      startDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
    const endDateStr = `${endDate.getFullYear()}-${String(
      endDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    const [
      { data: ministryEvents },
      { data: unavailabilityData },
      { data: eventCountData },
    ] = await Promise.all([
      supabase
        .from("events")
        .select("id, date, start_time, event_ministries!inner(ministry_id)")
        .eq("event_ministries.ministry_id", activeMinistryId)
        .gte("date", startDateStr)
        .lte("date", endDateStr),
      supabase
        .from("volunteer_unavailability")
        .select("user_id, unavailable_date")
        .in("user_id", volunteerIds)
        .gte("unavailable_date", startDateStr)
        .lte("unavailable_date", endDateStr),
      supabase
        .from("volunteer_slots")
        .select("user_id, events!inner(id, date)")
        .in("user_id", volunteerIds)
        .gte("events.date", startDateStr)
        .lte("events.date", endDateStr),
    ]);

    const ministryEventsList = (ministryEvents || []).map((ev: any) => ({
      date: ev.date,
      start_time: ev.start_time,
    }));
    setMonthlyEventsCount(ministryEventsList.length);

    const unavailableByUser: Record<string, Set<string>> = {};
    (unavailabilityData || []).forEach((u: any) => {
      if (!unavailableByUser[u.user_id]) {
        unavailableByUser[u.user_id] = new Set<string>();
      }
      unavailableByUser[u.user_id].add(u.unavailable_date);
    });

    const availabilityMap: Record<string, number> = {};
    volunteerIds.forEach((id) => {
      let availableEvents = 0;
      ministryEventsList.forEach((ev: any) => {
        const eventPeriod = getEventPeriod(ev.start_time);
        const isUnavailable = (unavailabilityData || []).some(
          (u: any) =>
            u.user_id === id &&
            u.unavailable_date === ev.date &&
            (u.period === "all_day" || u.period === eventPeriod),
        );
        if (!isUnavailable) {
          availableEvents++;
        }
      });
      availabilityMap[id] = availableEvents;
    });

    const eventCountMap: Record<string, number> = {};
    (eventCountData || []).forEach((item: any) => {
      eventCountMap[item.user_id] = (eventCountMap[item.user_id] || 0) + 1;
    });

    setVolunteerAvailabilityCount(availabilityMap);
    setVolunteerEventCount(eventCountMap);
    setPriorityLoading(false);
  }

  async function loadFunctionsForMinistry(ministryId: string) {
    setFunctionsLoading(true);
    const { data } = await supabase
      .from("ministry_functions")
      .select("id, name")
      .eq("ministry_id", ministryId)
      .order("name");

    setFunctions(data || []);
    setFunctionsLoading(false);
  }

  function getSlotForVolunteer(volunteerId: string) {
    return slots.find((s) => s.user_id === volunteerId);
  }

  function handleSelectVolunteer(volunteerId: string) {
    setSelectedVolunteerId(volunteerId);
    const existingSlot = getSlotForVolunteer(volunteerId);
    setSelectedFunctionId(existingSlot?.ministry_functions?.id || "");
    setFunctionModalOpen(true);
  }

  async function handleRemoveVolunteerFromEvent() {
    if (!selectedVolunteerId) return;
    const existingSlot = getSlotForVolunteer(selectedVolunteerId);
    if (!existingSlot) return;

    setSaving(true);
    setError(null);

    await supabase.from("volunteer_slots").delete().eq("id", existingSlot.id);

    await loadEventSlotsAndUnavailability();
    setSaving(false);
    setFunctionModalOpen(false);
  }

  async function handleConfirmFunction() {
    if (!activeMinistryId) return;
    if (!selectedVolunteerId) return;
    if (!selectedFunctionId) {
      setError("Selecione uma função para continuar.");
      return;
    }

    setSaving(true);
    setError(null);

    const existingSlot = getSlotForVolunteer(selectedVolunteerId);

    if (existingSlot) {
      await supabase
        .from("volunteer_slots")
        .update({
          ministry_id: activeMinistryId,
          function_id: selectedFunctionId,
          status: "confirmed",
        })
        .eq("id", existingSlot.id);
    } else {
      await supabase.from("volunteer_slots").insert({
        event_id: event.id,
        user_id: selectedVolunteerId,
        ministry_id: activeMinistryId,
        function_id: selectedFunctionId,
        status: "confirmed",
      });
    }

    await loadEventSlotsAndUnavailability();
    setSaving(false);
    setFunctionModalOpen(false);
  }

  const canManageEvent = manageableMinistries.length > 0;

  if (!canManageEvent) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={triggerSize}
          className={triggerClassName}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Cadastrar escalas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cadastrar escalas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando dados...
            </div>
          )}

          {needsMinistrySelection && (
            <div className="space-y-2">
              <Label>Ministério *</Label>
              <Select
                value={selectedMinistryId}
                onValueChange={(value) => {
                  setSelectedMinistryId(value);
                  setSelectedVolunteerId("");
                  setSelectedFunctionId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um ministério" />
                </SelectTrigger>
                <SelectContent>
                  {manageableMinistries.map((m) => (
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
          )}

          {!needsMinistrySelection && autoSelectedMinistry && (
            <div className="space-y-2">
              <Label>Ministério</Label>
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: autoSelectedMinistry.color }}
                />
                {autoSelectedMinistry.name}
              </div>
            </div>
          )}

          {activeMinistryId && (
            <div className="space-y-3">
              <Input
                placeholder="Buscar voluntário"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {volunteerLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando voluntários...
                </div>
              ) : filteredVolunteers.length > 0 ? (
                <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                  {filteredVolunteers.map((volunteer) => {
                    const slot = getSlotForVolunteer(volunteer.id);

                    return (
                      <button
                        key={volunteer.id}
                        type="button"
                        onClick={() => handleSelectVolunteer(volunteer.id)}
                        className={cn(
                          "w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted",
                          slot && "border-primary/40 bg-primary/5",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-card-foreground">
                              {volunteer.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {volunteer.email}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {monthlyEventsCount > 1 &&
                              volunteerAvailabilityCount[volunteer.id] ===
                                1 && (
                                <Badge variant="destructive">
                                  Só pode nesse dia
                                </Badge>
                              )}
                            <Badge variant="secondary">
                              {volunteerEventCount[volunteer.id] ?? 0} eventos
                            </Badge>
                            {slot && (
                              <Badge variant="secondary">
                                Já escalado
                                {slot.ministry_functions?.name
                                  ? ` • ${slot.ministry_functions.name}`
                                  : ""}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum voluntário disponível com os filtros atuais.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      <Dialog open={functionModalOpen} onOpenChange={setFunctionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Função *</Label>
              {functionsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Carregando funções...
                </p>
              ) : functions.length > 0 ? (
                <Select
                  value={selectedFunctionId}
                  onValueChange={setSelectedFunctionId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    {functions.map((fn) => (
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFunctionModalOpen(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {getSlotForVolunteer(selectedVolunteerId) && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRemoveVolunteerFromEvent}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    "Remover"
                  )}
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleConfirmFunction}
                disabled={saving || functionsLoading || functions.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
