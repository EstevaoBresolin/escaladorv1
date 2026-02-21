"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2, CalendarOff, Info } from "lucide-react";
import { format, parseISO, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AvailabilityCalendar } from "@/components/dashboard/availability-calendar";

interface Unavailability {
  id: string;
  unavailable_date: string;
  period: string;
  reason: string | null;
  created_at: string;
}

interface ScheduledEvent {
  id: string;
  date: string;
  title: string;
  start_time?: string;
}

export default function DisponibilidadePage() {
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>(
    [],
  );
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined,
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([loadUnavailabilities(), loadScheduledEvents()]);
  }

  async function loadUnavailabilities() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("volunteer_unavailability")
      .select("*")
      .eq("user_id", user.id)
      .gte("unavailable_date", startOfToday().toISOString().split("T")[0])
      .order("unavailable_date", { ascending: true });

    setUnavailabilities(data || []);
    setLoading(false);
  }

  async function loadScheduledEvents() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("volunteer_slots")
      .select("id, events!inner(id, date, title, start_time)")
      .eq("user_id", user.id)
      .gte("events.date", startOfToday().toISOString().split("T")[0]);

    if (data) {
      const events = data.map((slot: any) => {
        const event = Array.isArray(slot.events) ? slot.events[0] : slot.events;
        return {
          id: event.id,
          date: event.date,
          title: event.title,
          start_time: event.start_time,
        };
      });
      setScheduledEvents(events);
    }
  }

  async function handleAddUnavailability() {
    if (!selectedDate || selectedPeriods.length === 0) return;
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    // Helper to get event period based on start time
    function getEventPeriod(startTime?: string): string {
      if (!startTime) return "all_day";
      const [hours] = startTime.split(":").map(Number);
      if (hours >= 6 && hours < 12) return "morning";
      if (hours >= 12 && hours < 18) return "afternoon";
      return "evening";
    }

    // Check if user is already scheduled for any event on this date/period
    const { data: scheduledSlots } = await supabase
      .from("volunteer_slots")
      .select("id, events!inner(date, start_time, title)")
      .eq("user_id", user.id);

    // Filter slots for the selected date
    const conflictingSlots = scheduledSlots?.filter((slot: any) => {
      const event = Array.isArray(slot.events) ? slot.events[0] : slot.events;
      if (event?.date !== selectedDate) return false;

      const eventPeriod = getEventPeriod(event?.start_time);

      // If trying to mark all day unavailable, conflict with any event
      if (selectedPeriods.includes("all_day")) return true;

      // If event is all day, conflict with any period
      if (eventPeriod === "all_day") return true;

      // If periods match, there's a conflict
      return selectedPeriods.includes(eventPeriod);
    });

    if (conflictingSlots && conflictingSlots.length > 0) {
      const event = Array.isArray(conflictingSlots[0].events)
        ? conflictingSlots[0].events[0]
        : conflictingSlots[0].events;
      const eventTitle = event?.title || "um evento";

      setError(
        `Você já está escalado para "${eventTitle}" neste dia. Entre em contato com o líder do ministério para ser removido da escala antes de marcar indisponibilidade.`,
      );
      setSaving(false);
      return;
    }

    // Remove existing unavailabilities for this date first (to enable editing)
    const existingUnavailabilities = unavailabilities.filter(
      (u) => u.unavailable_date === selectedDate,
    );

    if (existingUnavailabilities.length > 0) {
      await Promise.all(
        existingUnavailabilities.map((u) =>
          supabase.from("volunteer_unavailability").delete().eq("id", u.id),
        ),
      );
    }

    // Insert unavailabilities for each selected period
    const insertPromises = selectedPeriods.map((period) =>
      supabase.from("volunteer_unavailability").insert({
        user_id: user.id,
        unavailable_date: selectedDate,
        period: period,
        reason: reason || null,
      }),
    );

    const results = await Promise.all(insertPromises);
    const hasError = results.some((r) => r.error);

    if (!hasError) {
      setOpen(false);
      setSelectedDate(undefined);
      setSelectedPeriods([]);
      setReason("");
      setError(null);
      loadUnavailabilities();
    } else {
      setError("Erro ao salvar indisponibilidade. Tente novamente.");
    }

    setSaving(false);
  }

  async function handleRemoveUnavailability(id: string) {
    setRemovingId(id);
    await supabase.from("volunteer_unavailability").delete().eq("id", id);
    setRemovingId(null);
    loadUnavailabilities();
  }

  // Group unavailabilities by date for calendar
  const unavailabilitiesByDate = unavailabilities.reduce(
    (acc, item) => {
      if (!acc[item.unavailable_date]) {
        acc[item.unavailable_date] = [];
      }
      acc[item.unavailable_date].push(item.period);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  const calendarUnavailabilities = Object.entries(unavailabilitiesByDate).map(
    ([date, periods]) => ({
      date,
      periods,
    }),
  );

  const togglePeriod = (period: string) => {
    // Toggle the period
    if (selectedPeriods.includes(period)) {
      setSelectedPeriods(selectedPeriods.filter((p) => p !== period));
      return;
    }

    // If selecting "all_day", clear other selections
    if (period === "all_day") {
      setSelectedPeriods(["all_day"]);
      return;
    }

    // If "all_day" is selected and user clicks another period, remove "all_day"
    if (selectedPeriods.includes("all_day")) {
      setSelectedPeriods([period]);
      return;
    }

    // Add the period
    setSelectedPeriods([...selectedPeriods, period]);
  };

  const handleRemoveAllUnavailabilitiesForDate = async () => {
    if (!selectedDate) return;
    setRemovingId("modal");

    const unavailabilitiesToRemove = unavailabilities.filter(
      (u) => u.unavailable_date === selectedDate,
    );

    await Promise.all(
      unavailabilitiesToRemove.map((u) =>
        supabase.from("volunteer_unavailability").delete().eq("id", u.id),
      ),
    );

    setRemovingId(null);
    setOpen(false);
    setSelectedDate(undefined);
    setSelectedPeriods([]);
    setReason("");
    setError(null);
    loadUnavailabilities();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="h-5 w-44 rounded bg-muted" />
          <div className="mt-2 h-8 w-56 rounded bg-muted" />
          <div className="mt-2 h-4 w-80 rounded bg-muted" />
        </div>
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-6">
            <div className="h-4 w-64 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="h-[360px] w-full rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <p className="text-sm font-medium text-primary">
          Gestão de agenda pessoal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Minha Disponibilidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Marque períodos indisponíveis para evitar conflitos na escala da sua
          equipe.
        </p>
      </section>

      <Card className="hidden rounded-2xl border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 md:block">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Como funciona?
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Clique em um dia do calendário para marcar indisponibilidade. Dias
              em vermelho já têm restrições cadastradas. Dias com eventos
              mostram suas escalas.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-4 md:p-6">
          <AvailabilityCalendar
            unavailabilities={calendarUnavailabilities}
            events={scheduledEvents}
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onSelectDate={(date) => {
              setSelectedDate(date);

              const existingUnavailabilities = unavailabilities.filter(
                (u) => u.unavailable_date === date,
              );

              if (existingUnavailabilities.length > 0) {
                setSelectedPeriods(
                  existingUnavailabilities.map((u) => u.period),
                );
                setReason(existingUnavailabilities[0].reason || "");
              } else {
                setSelectedPeriods([]);
                setReason("");
              }

              setError(null);
              setOpen(true);
            }}
          />
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setError(null);
            setSelectedDate(undefined);
            setSelectedPeriods([]);
            setReason("");
          }
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Adicionar Indisponibilidade
              {selectedDate && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  {format(
                    parseISO(selectedDate),
                    "EEEE, d 'de' MMMM 'de' yyyy",
                    {
                      locale: ptBR,
                    },
                  )}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Períodos * (selecione um ou mais)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={
                    selectedPeriods.includes("all_day") ? "default" : "outline"
                  }
                  onClick={() => togglePeriod("all_day")}
                  className="w-full"
                >
                  Dia Todo
                </Button>
                <Button
                  type="button"
                  variant={
                    selectedPeriods.includes("morning") ? "default" : "outline"
                  }
                  onClick={() => togglePeriod("morning")}
                  className="w-full"
                  disabled={selectedPeriods.includes("all_day")}
                >
                  Manhã
                </Button>
                <Button
                  type="button"
                  variant={
                    selectedPeriods.includes("afternoon")
                      ? "default"
                      : "outline"
                  }
                  onClick={() => togglePeriod("afternoon")}
                  className="w-full"
                  disabled={selectedPeriods.includes("all_day")}
                >
                  Tarde
                </Button>
                <Button
                  type="button"
                  variant={
                    selectedPeriods.includes("evening") ? "default" : "outline"
                  }
                  onClick={() => togglePeriod("evening")}
                  className="w-full"
                  disabled={selectedPeriods.includes("all_day")}
                >
                  Noite
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Viagem, compromisso familiar..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {unavailabilities.some(
                (u) => u.unavailable_date === selectedDate,
              ) && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleRemoveAllUnavailabilitiesForDate}
                  disabled={removingId === "modal" || saving}
                >
                  {removingId === "modal" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </>
                  )}
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleAddUnavailability}
                disabled={
                  !selectedDate || selectedPeriods.length === 0 || saving
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
