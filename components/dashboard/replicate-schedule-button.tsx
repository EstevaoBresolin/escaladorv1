"use client";

import { useState, useEffect } from "react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Ministry {
  id: string;
  name: string;
  color: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
}

interface ReplicateScheduleButtonProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  ledMinistryIds: string[];
  eventMinistries: Ministry[];
}

export function ReplicateScheduleButton({
  eventId,
  eventTitle,
  eventDate,
  ledMinistryIds,
  eventMinistries,
}: ReplicateScheduleButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [futureEvents, setFutureEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string>("");

  // Filter ministries that the user leads and are involved in the event
  const leaderMinistries = eventMinistries.filter((ministry) =>
    ledMinistryIds.includes(ministry.id)
  );

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedMinistryId("");
      setSelectedEventId("");
      setFutureEvents([]);
      setError("");
    }
  }, [open]);

  // Auto-select ministry if user leads only one
  useEffect(() => {
    if (leaderMinistries.length === 1) {
      setSelectedMinistryId(leaderMinistries[0].id);
    }
  }, [leaderMinistries]);

  // Fetch future events when ministry is selected
  useEffect(() => {
    if (selectedMinistryId && open) {
      fetchFutureEvents();
    } else {
      setFutureEvents([]);
      setSelectedEventId("");
    }
  }, [selectedMinistryId, open]);

  async function fetchFutureEvents() {
    const supabase = createClient();

    // Fetch events that:
    // 1. Have the selected ministry involved
    // 2. Are in the future (after the current event date)
    // 3. Are not the current event
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        date,
        start_time,
        event_ministries!inner(ministry_id)
      `
      )
      .eq("event_ministries.ministry_id", selectedMinistryId)
      .gt("date", eventDate)
      .neq("id", eventId)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching future events:", error);
      setError("Erro ao buscar eventos futuros");
      return;
    }

    setFutureEvents(data || []);
  }

  async function handleReplicate() {
    if (!selectedMinistryId || !selectedEventId) {
      setError("Selecione todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/events/replicate-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceEventId: eventId,
          targetEventId: selectedEventId,
          ministryId: selectedMinistryId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao replicar escala");
      }

      // Success - close dialog and refresh page
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Error replicating schedule:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao replicar escala"
      );
    } finally {
      setLoading(false);
    }
  }

  // Don't show button if user doesn't lead any ministry involved in the event
  if (leaderMinistries.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy className="mr-2 h-4 w-4" />
          Replicar Escala
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Replicar Escala de Voluntários</DialogTitle>
          <DialogDescription>
            Copie a escala de voluntários do evento atual para um evento
            futuro. Apenas os voluntários do ministério selecionado serão
            copiados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Event Info */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm font-medium">Evento de Origem</p>
            <p className="text-sm text-muted-foreground">{eventTitle}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(eventDate + "T12:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Ministry Selection (if user leads multiple ministries) */}
          {leaderMinistries.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="ministry">
                Ministério <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedMinistryId}
                onValueChange={setSelectedMinistryId}
              >
                <SelectTrigger id="ministry">
                  <SelectValue placeholder="Selecione o ministério" />
                </SelectTrigger>
                <SelectContent>
                  {leaderMinistries.map((ministry) => (
                    <SelectItem key={ministry.id} value={ministry.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: ministry.color }}
                        />
                        {ministry.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show selected ministry if only one */}
          {leaderMinistries.length === 1 && (
            <div className="space-y-2">
              <Label>Ministério</Label>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: leaderMinistries[0].color }}
                />
                <span className="text-sm font-medium">
                  {leaderMinistries[0].name}
                </span>
              </div>
            </div>
          )}

          {/* Target Event Selection */}
          {selectedMinistryId && (
            <div className="space-y-2">
              <Label htmlFor="targetEvent">
                Evento de Destino <span className="text-destructive">*</span>
              </Label>
              {futureEvents.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Nenhum evento futuro encontrado para este ministério
                </div>
              ) : (
                <Select
                  value={selectedEventId}
                  onValueChange={setSelectedEventId}
                >
                  <SelectTrigger id="targetEvent">
                    <SelectValue placeholder="Selecione o evento destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {futureEvents.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        <div className="flex flex-col">
                          <span>{event.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              event.date + "T12:00:00"
                            ).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                            {event.start_time &&
                              ` • ${event.start_time.slice(0, 5)}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReplicate}
            disabled={
              loading ||
              !selectedMinistryId ||
              !selectedEventId ||
              futureEvents.length === 0
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Replicando...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Replicar Escala
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
