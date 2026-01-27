"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Plus, Trash2, CalendarOff, CalendarIcon, Info } from "lucide-react";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Unavailability {
  id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

export default function DisponibilidadePage() {
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadUnavailabilities();
  }, []);

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
      .gte("date", startOfToday().toISOString().split("T")[0])
      .order("date", { ascending: true });

    setUnavailabilities(data || []);
    setLoading(false);
  }

  async function handleAddUnavailability() {
    console.log("[v0] handleAddUnavailability called, selectedDate:", selectedDate);
    if (!selectedDate) {
      console.log("[v0] No date selected, returning");
      return;
    }
    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("[v0] User data:", user, "Auth error:", authError);

      if (!user) {
        console.log("[v0] No user found, returning");
        setSaving(false);
        return;
      }

      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      console.log("[v0] Inserting unavailability for date:", formattedDate);

      const { error } = await supabase.from("volunteer_unavailability").insert({
        user_id: user.id,
        date: formattedDate,
        reason: reason || null,
      });

      console.log("[v0] Insert result, error:", error);

      if (!error) {
        setOpen(false);
        setSelectedDate(undefined);
        setReason("");
        await loadUnavailabilities();
      }
    } catch (err) {
      console.log("[v0] Caught error:", err);
    }

    setSaving(false);
  }

  async function handleRemoveUnavailability(id: string) {
    setRemovingId(id);
    await supabase.from("volunteer_unavailability").delete().eq("id", id);
    setRemovingId(null);
    await loadUnavailabilities();
  }

  // Get all unavailable dates for calendar highlighting
  const unavailableDates = unavailabilities.map((u) => parseISO(u.date));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha Disponibilidade</h1>
        <p className="text-muted-foreground">
          Marque os dias em que você NAO pode servir como voluntário
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Como funciona?
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Adicione aqui apenas os dias em que voce NAO estara disponivel. 
              Nos demais dias, voce sera considerado disponivel para ser escalado 
              em eventos.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dias Indisponiveis</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Indisponibilidade</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate
                            ? format(selectedDate, "PPP", { locale: ptBR })
                            : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date < startOfToday() ||
                            unavailableDates.some(
                              (d) =>
                                d.toISOString().split("T")[0] ===
                                date.toISOString().split("T")[0]
                            )
                          }
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
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

                  <Button
                    className="w-full"
                    onClick={handleAddUnavailability}
                    disabled={!selectedDate || saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {unavailabilities.length > 0 ? (
              <div className="space-y-2">
                {unavailabilities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                        <CalendarOff className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {format(parseISO(item.date), "EEEE, d 'de' MMMM", {
                            locale: ptBR,
                          })}
                        </p>
                        {item.reason && (
                          <p className="text-sm text-muted-foreground">
                            {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveUnavailability(item.id)}
                      disabled={removingId === item.id}
                    >
                      {removingId === item.id ? (
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
                <CalendarOff className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Voce ainda nao marcou nenhum dia como indisponivel.
                </p>
                <p className="text-sm text-muted-foreground">
                  Isso significa que voce esta disponivel todos os dias.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-destructive">
                {unavailabilities.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {unavailabilities.length === 1
                  ? "dia marcado como indisponivel"
                  : "dias marcados como indisponiveis"}
              </p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Lembre-se de manter sua disponibilidade atualizada para que os
                lideres possam escala-lo corretamente nos eventos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
