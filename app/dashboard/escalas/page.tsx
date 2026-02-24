"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserPermissionsByProfile } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  UserRound,
} from "lucide-react";
import {
  DashboardEmptyState,
  DashboardErrorAlert,
} from "@/components/dashboard/dashboard-feedback";
import { VolunteerSearch } from "@/components/dashboard/volunteer-search";

interface VolunteerOption {
  id: string;
  name: string;
  email: string;
}

interface VolunteerScheduleItem {
  id: string;
  eventId: string;
  title: string;
  date: string;
  startTime?: string | null;
  location?: string | null;
  ministryName?: string | null;
  ministryColor?: string | null;
}

export default function EscalasPage() {
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<VolunteerScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const monthLabel = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const monthRange = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
    return { startStr, endStr };
  }, [currentMonth]);

  useEffect(() => {
    async function loadVolunteers() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, email, role, church_id")
        .eq("id", user.id)
        .single();

      if (!profile?.church_id) {
        setError("Igreja não encontrada.");
        setLoading(false);
        return;
      }

      const permissions = await getUserPermissionsByProfile(
        supabase,
        user.id,
        profile.role,
      );
      const isAdmin = permissions?.isAdmin || false;
      const ledMinistryIds = permissions?.ledMinistryIds || [];

      if (isAdmin) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("church_id", profile.church_id)
          .order("name");

        const options = (profiles || []).map((p) => ({
          id: p.id,
          name: p.name || p.email,
          email: p.email || "",
        }));

        setVolunteers(options);
        setSelectedVolunteerId((current) =>
          current && options.some((opt) => opt.id === current)
            ? current
            : options[0]?.id || "",
        );
        if (options.length > 0) {
          setSelectedVolunteerId((prev) => prev || options[0].id);
        }
        setLoading(false);
        return;
      }

      if (ledMinistryIds.length > 0) {
        const { data: ministryVolunteers } = await supabase
          .from("profiles")
          .select("id, name, email, user_ministries!inner(ministry_id)")
          .eq("church_id", profile.church_id)
          .in("user_ministries.ministry_id", ledMinistryIds)
          .order("name");

        const map = new Map<string, VolunteerOption>();
        (ministryVolunteers || []).forEach((row: any) => {
          if (!row?.id) return;
          map.set(row.id, {
            id: row.id,
            name: row.name || row.email,
            email: row.email || "",
          });
        });

        const options = Array.from(map.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        setVolunteers(options);
        setSelectedVolunteerId((current) =>
          current && options.some((opt) => opt.id === current)
            ? current
            : options[0]?.id || "",
        );
        setLoading(false);
        return;
      }

      if (profile.role === "volunteer") {
        const selfOption = {
          id: profile.id,
          name: profile.name || user.email || "Voluntário",
          email: profile.email || user.email || "",
        };
        setVolunteers([selfOption]);
        setSelectedVolunteerId(selfOption.id);
        setLoading(false);
        return;
      }

      setVolunteers([]);
      setSelectedVolunteerId("");
      setLoading(false);
    }

    loadVolunteers();
  }, [supabase]);

  useEffect(() => {
    async function loadSchedules() {
      if (!selectedVolunteerId) return;

      setLoadingSchedules(true);
      setError(null);

      const { data, error } = await supabase
        .from("volunteer_slots")
        .select(
          "id, events!inner(id, title, date, start_time, location), ministries(id, name, color)",
        )
        .eq("user_id", selectedVolunteerId)
        .gte("events.date", monthRange.startStr)
        .lte("events.date", monthRange.endStr);

      if (error) {
        setError("Erro ao carregar escalas. Tente novamente.");
        setLoadingSchedules(false);
        return;
      }

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        eventId: row.events?.id,
        title: row.events?.title,
        date: row.events?.date,
        startTime: row.events?.start_time,
        location: row.events?.location,
        ministryName: row.ministries?.name || null,
        ministryColor: row.ministries?.color || null,
      }));

      mapped.sort((a, b) => {
        const dateCompare = (a.date || "").localeCompare(b.date || "");
        if (dateCompare !== 0) {
          return dateCompare;
        }
        return (a.startTime || "").localeCompare(b.startTime || "");
      });

      setSchedules(mapped);
      setLoadingSchedules(false);
    }

    loadSchedules();
  }, [supabase, selectedVolunteerId, monthRange]);

  function handlePrevMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  }

  function handleNextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  }

  const showSchedulesSkeleton = loadingSchedules && schedules.length === 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-6">
        <p className="text-sm font-medium text-primary">Planejamento mensal</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Escalas do Mês
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Consulte as escalas por voluntário e acompanhe a agenda de cada
          ministério.
        </p>
      </section>

      <Card className="rounded-2xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="capitalize">{monthLabel}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {loadingSchedules ? (
                  <span className="inline-block h-4 w-40 animate-pulse rounded bg-muted" />
                ) : (
                  <>Total de escalas no período: {schedules.length}</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                disabled={loadingSchedules}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                disabled={loadingSchedules}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <UserRound className="h-4 w-4 text-primary" />
                Voluntário
              </p>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-10 w-full animate-pulse rounded-lg border border-input bg-muted/40" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              ) : volunteers.length > 0 ? (
                <VolunteerSearch
                  volunteers={volunteers}
                  selectedVolunteerId={selectedVolunteerId}
                  onSelectVolunteer={setSelectedVolunteerId}
                  showEventStats={false}
                  showLabel={false}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum voluntário disponível.
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && <DashboardErrorAlert message={error} />}

          {showSchedulesSkeleton ? (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full table-fixed">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="w-[40%] px-4 py-2 text-left">Evento</th>
                    <th className="w-[42%] px-4 py-2 text-left">
                      Data e detalhes
                    </th>
                    <th className="w-[18%] px-4 py-2 text-left">Ministério</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((row) => (
                    <tr
                      key={row}
                      className="border-t border-border first:border-t-0"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : schedules.length === 0 ? (
            <DashboardEmptyState
              icon={Calendar}
              title="Nenhuma escala encontrada"
              description="Não há escalas para o voluntário selecionado neste mês."
              className="bg-background"
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full table-fixed">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="w-[40%] px-4 py-2 text-left">Evento</th>
                    <th className="w-[42%] px-4 py-2 text-left">
                      Data e detalhes
                    </th>
                    <th className="w-[18%] px-4 py-2 text-left">Ministério</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="border-t border-border first:border-t-0"
                    >
                      <td className="px-4 py-3 align-middle">
                        <p className="font-medium text-card-foreground">
                          {schedule.title}
                        </p>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4 shrink-0" />
                            {new Date(
                              `${schedule.date}T12:00:00`,
                            ).toLocaleDateString("pt-BR", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>

                          {schedule.startTime && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-4 w-4 shrink-0" />
                              {schedule.startTime.slice(0, 5)}
                            </span>
                          )}

                          {schedule.location && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {schedule.location}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        {schedule.ministryName ? (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${schedule.ministryColor || "#2563eb"}20`,
                              color: schedule.ministryColor || "#2563eb",
                            }}
                          >
                            {schedule.ministryName}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
