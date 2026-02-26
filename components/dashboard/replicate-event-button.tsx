"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Loader2 } from "lucide-react";

interface ReplicateEventButtonProps {
  eventId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  churchId: string;
  ministryIds: string[];
  data: string;
  hasSchedules: boolean;
  triggerSize?: "default" | "sm" | "lg";
  triggerClassName?: string;
}

export function ReplicateEventButton({
  eventId,
  title,
  description,
  location,
  churchId,
  ministryIds,
  hasSchedules,
  data,
  triggerSize = "default",
  triggerClassName,
}: ReplicateEventButtonProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(data);
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  async function handleReplicate() {
    if (!date || !time) {
      setError("Preencha data e horário para replicar o evento.");
      return;
    }

    setSaving(true);
    setError(null);

    const normalizedTime = time.length === 5 ? `${time}:00` : time;

    const { data: newEvent, error: insertEventError } = await supabase
      .from("events")
      .insert({
        church_id: churchId,
        title,
        description: description || null,
        location: location || null,
        date,
        start_time: normalizedTime,
      })
      .select("id")
      .single();

    if (insertEventError || !newEvent?.id) {
      setError("Não foi possível replicar o evento.");
      setSaving(false);
      return;
    }

    if (ministryIds.length > 0) {
      const rows = ministryIds.map((ministryId) => ({
        event_id: newEvent.id,
        ministry_id: ministryId,
      }));

      const { error: insertMinistriesError } = await supabase
        .from("event_ministries")
        .insert(rows);

      if (insertMinistriesError) {
        setError("Evento replicado, mas houve erro ao copiar ministérios.");
        setSaving(false);
        return;
      }
    }

    setOpen(false);
    setDate("");
    setTime("");
    setSaving(false);
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={triggerSize}
          className={triggerClassName}
          disabled={hasSchedules}
          title={
            hasSchedules
              ? "Não é possível replicar evento com escalas cadastradas"
              : undefined
          }
        >
          <Copy className="mr-2 h-4 w-4" />
          Replicar evento
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replicar evento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor={`replicate-date-${eventId}`}>Data *</Label>
            <Input
              id={`replicate-date-${eventId}`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`replicate-time-${eventId}`}>Horário *</Label>
            <Input
              id={`replicate-time-${eventId}`}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleReplicate}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Replicando...
              </>
            ) : (
              "Replicar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
