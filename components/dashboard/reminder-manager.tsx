"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  MessageCircle,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NotificationChannel = "email" | "whatsapp";

interface Event {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
}

interface SendResult {
  success: boolean;
  message: string;
  details?: {
    total: number;
    sent: number;
    failed: number;
  };
}

export function ReminderManager() {
  const [channel, setChannel] = useState<NotificationChannel>("email");
  const [enableFallback, setEnableFallback] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [result, setResult] = useState<SendResult | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadEvents() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      if (!profile?.church_id) return;

      // Get upcoming events (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const todayStr = today.toISOString().split("T")[0];
      const nextWeekStr = nextWeek.toISOString().split("T")[0];

      const { data } = await supabase
        .from("events")
        .select("id, title, date, start_time")
        .eq("church_id", profile.church_id)
        .gte("date", todayStr)
        .lte("date", nextWeekStr)
        .order("date", { ascending: true });

      setEvents(data || []);
      setLoadingEvents(false);
    }

    loadEvents();
  }, [supabase]);

  async function handleSendReminders() {
    if (!selectedEvent) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/reminders/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEvent,
          channel,
          enableFallback,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: "Lembretes enviados com sucesso!",
          details: {
            total: data.total || 0,
            sent: data.sent || 0,
            failed: data.failed || 0,
          },
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Erro ao enviar lembretes",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Erro de conexao. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleTestCron() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/cron/send-reminders", {
        method: "GET",
        headers: {
          "x-vercel-cron-test": "true",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Cron executado! ${data.sent || 0} lembretes enviados para eventos de amanha.`,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Erro ao executar cron",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Erro de conexao. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  const selectedEventData = events.find((e) => e.id === selectedEvent);

  return (
    <div className="space-y-6">
      {/* Channel Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Canal de Notificacao
          </CardTitle>
          <CardDescription>
            Escolha como os lembretes serao enviados aos voluntarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 bg-popover p-4 transition-colors hover:bg-accent hover:text-accent-foreground",
                channel === "email" ? "border-primary" : "border-muted",
              )}
            >
              <Mail className="mb-3 h-6 w-6" />
              <span className="font-semibold">Email</span>
              <span className="text-xs text-muted-foreground text-center mt-1">
                Envia emails formatados com Resend
              </span>
            </button>
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-between rounded-lg border-2 bg-popover p-4 transition-colors hover:bg-accent hover:text-accent-foreground",
                channel === "whatsapp" ? "border-primary" : "border-muted",
              )}
            >
              <MessageCircle className="mb-3 h-6 w-6" />
              <span className="font-semibold">WhatsApp</span>
              <span className="text-xs text-muted-foreground text-center mt-1">
                Envia mensagens via Twilio
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="fallback">Fallback automatico</Label>
              <p className="text-sm text-muted-foreground">
                Se o canal principal falhar, tenta o outro automaticamente
              </p>
            </div>
            <Switch
              id="fallback"
              checked={enableFallback}
              onCheckedChange={setEnableFallback}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Envio automatico</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Lembretes sao enviados automaticamente todos os dias as{" "}
              <strong>10:00 (horario de Brasilia)</strong> para voluntarios
              escalados em eventos do dia seguinte.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Send */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Envio Manual
          </CardTitle>
          <CardDescription>
            Envie lembretes manualmente para um evento especifico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event">Selecione o evento</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger id="event">
                <SelectValue placeholder="Escolha um evento..." />
              </SelectTrigger>
              <SelectContent>
                {loadingEvents ? (
                  <SelectItem value="loading" disabled>
                    Carregando eventos...
                  </SelectItem>
                ) : events.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Nenhum evento nos proximos 7 dias
                  </SelectItem>
                ) : (
                  events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{event.title}</span>
                        <span className="text-muted-foreground">
                          -{" "}
                          {new Date(
                            event.date + "T12:00:00",
                          ).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedEventData && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{selectedEventData.title}</p>
              <p className="text-muted-foreground">
                {new Date(
                  selectedEventData.date + "T12:00:00",
                ).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {selectedEventData.start_time &&
                  ` as ${selectedEventData.start_time.slice(0, 5)}`}
              </p>
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.success
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{result.message}</span>
              </div>
              {result.details && (
                <div className="mt-2 text-sm opacity-80">
                  Total: {result.details.total} | Enviados:{" "}
                  {result.details.sent} | Falhas: {result.details.failed}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleSendReminders}
              disabled={loading || !selectedEvent}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Lembretes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestCron}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock className="mr-2 h-4 w-4" />
              )}
              Testar Cron
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables Info */}
      <Card>
        <CardHeader>
          <CardTitle>Variaveis de Ambiente</CardTitle>
          <CardDescription>
            Certifique-se de configurar as variaveis necessarias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-medium">Para Email (Resend)</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    RESEND_API_KEY
                  </code>
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    RESEND_FROM_EMAIL
                  </code>{" "}
                  (opcional)
                </li>
              </ul>
            </div>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">Para WhatsApp (Twilio)</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    TWILIO_ACCOUNT_SID
                  </code>
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    TWILIO_AUTH_TOKEN
                  </code>
                </li>
                <li>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    TWILIO_WHATSAPP_FROM
                  </code>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
