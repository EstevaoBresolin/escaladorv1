import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Users, Check } from "lucide-react";
import { MarkAllReadButton } from "@/components/dashboard/mark-all-read-button";
import { getCachedUser } from "@/lib/supabase/cache";

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    return null;
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? "ões" : ""} não lida${unreadCount > 1 ? "s" : ""}`
              : "Todas as notificações foram lidas"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton userId={user.id} />}
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const icons = {
                  event: Calendar,
                  schedule: Users,
                  system: Bell,
                };
                const Icon =
                  icons[notification.type as keyof typeof icons] || Bell;

                return (
                  <div
                    key={notification.id}
                    className={`flex gap-4 p-4 transition-colors ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        !notification.is_read
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`${
                          !notification.is_read
                            ? "font-medium text-card-foreground"
                            : "text-card-foreground"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString(
                          "pt-BR",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex h-2 w-2 flex-shrink-0 items-center justify-center rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                Nenhuma notificação
              </h3>
              <p className="text-center text-muted-foreground">
                Você será notificado sobre novos eventos e escalas aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
