"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface SendReminderButtonProps {
  eventId: string;
  eventTitle: string;
}

interface ReminderResult {
  message: string;
  event: string;
  sent: number;
  failed: number;
  skipped: number;
  details: { volunteer: string; status: string; error?: string }[];
}

export function SendReminderButton({
  eventId,
  eventTitle,
}: SendReminderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [result, setResult] = useState<ReminderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendReminders() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/reminders/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar lembretes");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Erro de conexao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="sm:hidden">Lembretes</span>
        <span className="hidden sm:inline">Enviar Lembretes</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Lembretes via WhatsApp</DialogTitle>
            <DialogDescription>
              Enviar mensagens de lembrete para todos os voluntarios escalados
              no evento "{eventTitle}".
            </DialogDescription>
          </DialogHeader>

          {!result && !error && !loading && (
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Ao confirmar, sera enviada uma mensagem via WhatsApp para cada
                voluntario escalado (com status confirmado ou pendente) que
                tenha telefone cadastrado.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">
                Enviando lembretes...
              </p>
            </div>
          )}

          {error && (
            <div className="py-4">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Erro</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {result && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="text-2xl font-bold text-emerald-600">
                    {result.sent}
                  </div>
                  <div className="text-xs text-emerald-600">Enviados</div>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <div className="text-2xl font-bold text-red-600">
                    {result.failed}
                  </div>
                  <div className="text-xs text-red-600">Falhas</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <div className="text-2xl font-bold text-amber-600">
                    {result.skipped}
                  </div>
                  <div className="text-xs text-amber-600">Ignorados</div>
                </div>
              </div>

              {result.details.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Voluntario
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((detail, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{detail.volunteer}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1 text-xs ${
                                detail.status === "sent"
                                  ? "text-emerald-600"
                                  : detail.status === "failed"
                                    ? "text-red-600"
                                    : "text-amber-600"
                              }`}
                            >
                              {detail.status === "sent" && (
                                <CheckCircle className="h-3 w-3" />
                              )}
                              {detail.status === "failed" && (
                                <XCircle className="h-3 w-3" />
                              )}
                              {detail.status === "skipped" && (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {detail.status === "sent" && "Enviado"}
                              {detail.status === "failed" &&
                                (detail.error || "Falha")}
                              {detail.status === "skipped" &&
                                (detail.error || "Ignorado")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!result && !loading && (
              <>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSendReminders} disabled={loading}>
                  Confirmar Envio
                </Button>
              </>
            )}
            {(result || error) && (
              <Button
                onClick={() => {
                  setShowDialog(false);
                  setResult(null);
                  setError(null);
                }}
              >
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
