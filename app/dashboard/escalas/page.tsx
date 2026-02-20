"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserPermissions } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";

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
  const supabase = createClient();

  const monthLabel = currentMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const monthRange = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startStr = `${start.getFullYear()}-${String(
      start.getMonth() + 1,
    ).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(end.getDate()).padStart(2, "0")}`;
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

      if (profile.role === "volunteer") {
        const selfOption = {
          id: profile.id,
          name: profile.name || user.email || "Voluntário",
          email: profile.email || user.email || "",
        };
        setVolunteers([selfOption]);
        setSelectedVolunteerId(profile.id);
        setLoading(false);
        return;
      }

      const permissions = await getUserPermissions(supabase);
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
        if (!selectedVolunteerId && options.length > 0) {
          setSelectedVolunteerId(options[0].id);
        }
        setLoading(false);
        return;
      }

      if (ledMinistryIds.length > 0) {
        const { data: ministryVolunteers } = await supabase
          .from("user_ministries")
          .select("user_id, profiles(id, name, email)")
          .in("ministry_id", ledMinistryIds);

        const map = new Map<string, VolunteerOption>();
        (ministryVolunteers || []).forEach((row: any) => {
          if (!row.profiles) return;
          map.set(row.profiles.id, {
            id: row.profiles.id,
            name: row.profiles.name || row.profiles.email,
            email: row.profiles.email || "",
          });
        });

        const options = Array.from(map.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );

        setVolunteers(options);
        if (!selectedVolunteerId && options.length > 0) {
          setSelectedVolunteerId(options[0].id);
        }
        setLoading(false);
        return;
      }

      setVolunteers([]);
      setLoading(false);
    }

    loadVolunteers();
  }, [supabase, selectedVolunteerId]);

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
        .lte("events.date", monthRange.endStr)
        .order("date", { ascending: true, foreignTable: "events" })
        .order("start_time", { ascending: true, foreignTable: "events" });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Escalas do Mês</h1>
        <p className="text-muted-foreground">
          Consulte as escalas do voluntário selecionado
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="capitalize">{monthLabel}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Total no mês: {schedules.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Voluntário</p>
              {loading ? (
                <div className="h-10 rounded-md border border-input bg-background" />
              ) : volunteers.length > 0 ? (
                <Select
                  value={selectedVolunteerId}
                  onValueChange={setSelectedVolunteerId}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione um voluntário" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers.map((volunteer) => (
                      <SelectItem key={volunteer.id} value={volunteer.id}>
                        {volunteer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum voluntário disponível.
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {loadingSchedules ? (
            <div className="rounded-md border border-input bg-background p-4 text-sm text-muted-foreground">
              Carregando escalas...
            </div>
          ) : schedules.length === 0 ? (
            <div className="rounded-md border border-input bg-background p-4 text-sm text-muted-foreground">
              Nenhuma escala encontrada para este mês.
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">
                        {schedule.title}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
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
                            <Clock className="h-4 w-4" />
                            {schedule.startTime.slice(0, 5)}
                          </span>
                        )}
                        {schedule.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {schedule.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {schedule.ministryName && (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${schedule.ministryColor || "#2563eb"}20`,
                          color: schedule.ministryColor || "#2563eb",
                        }}
                      >
                        {schedule.ministryName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
