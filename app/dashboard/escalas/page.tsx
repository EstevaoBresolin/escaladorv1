"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserPermissionsByProfile } from "@/lib/permissions";
import { generateMinistryMonthlySchedulesPdf } from "@/lib/pdf-export";
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
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
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
  volunteerName?: string | null;
  volunteerEmail?: string | null;
  startTime?: string | null;
  location?: string | null;
  ministryName?: string | null;
  ministryColor?: string | null;
}

interface MinistryOption {
  id: string;
  name: string;
  color?: string | null;
}

type SelectionMode = "volunteer" | "ministry";

export default function EscalasPage() {
  const [volunteers, setVolunteers] = useState<VolunteerOption[]>([]);
  const [ministries, setMinistries] = useState<MinistryOption[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>("");
  const [selectionMode, setSelectionMode] =
    useState<SelectionMode>("volunteer");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [loadingMinistries, setLoadingMinistries] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [churchId, setChurchId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [ledMinistryIds, setLedMinistryIds] = useState<string[]>([]);
  const [isVolunteerOnly, setIsVolunteerOnly] = useState(false);
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

  const canChooseMinistry = !isVolunteerOnly && (isAdmin || ledMinistryIds.length > 0);

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

      setChurchId(profile.church_id);

      const permissions = await getUserPermissionsByProfile(
        supabase,
        user.id,
        profile.role,
      );
      const isAdminUser = permissions?.isAdmin || false;
      const ledIds = permissions?.ledMinistryIds || [];

      setIsAdmin(isAdminUser);
      setLedMinistryIds(ledIds);

      if (isAdminUser || ledIds.length > 0) {
        setVolunteers([]);
        setSelectedVolunteerId("");
        setIsVolunteerOnly(false);
        setSelectionMode("volunteer");
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
        setIsVolunteerOnly(true);
        setSelectionMode("volunteer");
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
    if (!churchId) return;
    if (selectionMode !== "volunteer") return;
    if (isVolunteerOnly) return;

    const term = searchTerm.trim();
    if (!term) {
      setVolunteers([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoadingVolunteers(true);

      const buildNameQuery = () => {
        if (isAdmin) {
          return supabase
            .from("profiles")
            .select("id, name, email")
            .eq("church_id", churchId)
            .ilike("name", `%${term}%`)
            .order("name")
            .limit(50);
        }

        return supabase
          .from("profiles")
          .select("id, name, email, user_ministries!inner(ministry_id)")
          .eq("church_id", churchId)
          .in("user_ministries.ministry_id", ledMinistryIds)
          .ilike("name", `%${term}%`)
          .order("name")
          .limit(50);
      };

      const buildEmailQuery = () => {
        if (isAdmin) {
          return supabase
            .from("profiles")
            .select("id, name, email")
            .eq("church_id", churchId)
            .ilike("email", `%${term}%`)
            .order("name")
            .limit(50);
        }

        return supabase
          .from("profiles")
          .select("id, name, email, user_ministries!inner(ministry_id)")
          .eq("church_id", churchId)
          .in("user_ministries.ministry_id", ledMinistryIds)
          .ilike("email", `%${term}%`)
          .order("name")
          .limit(50);
      };

      const [{ data: nameMatches }, { data: emailMatches }] = await Promise.all(
        [buildNameQuery(), buildEmailQuery()],
      );

      const byId = new Map<string, VolunteerOption>();
      ([...(nameMatches || []), ...(emailMatches || [])] as any[]).forEach(
        (row) => {
          if (!row?.id) return;
          byId.set(row.id, {
            id: row.id,
            name: row.name || row.email,
            email: row.email || "",
          });
        },
      );

      const options = Array.from(byId.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      setVolunteers(options);
      setLoadingVolunteers(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [
    churchId,
    selectionMode,
    isVolunteerOnly,
    searchTerm,
    isAdmin,
    ledMinistryIds,
    supabase,
  ]);

  useEffect(() => {
    async function loadMinistries() {
      if (!churchId || isVolunteerOnly) {
        setMinistries([]);
        setSelectedMinistryId("");
        return;
      }

      if (!isAdmin && ledMinistryIds.length === 0) {
        setMinistries([]);
        setSelectedMinistryId("");
        return;
      }

      setLoadingMinistries(true);

      let query = supabase
        .from("ministries")
        .select("id, name, color")
        .eq("church_id", churchId)
        .order("name");

      if (!isAdmin) {
        query = query.in("id", ledMinistryIds);
      }

      const { data, error } = await query;

      if (error) {
        setError("Erro ao carregar ministérios. Tente novamente.");
        setLoadingMinistries(false);
        return;
      }

      const options = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        color: row.color,
      }));

      setMinistries(options);
      if (!options.some((item) => item.id === selectedMinistryId)) {
        setSelectedMinistryId(options[0]?.id || "");
      }

      setLoadingMinistries(false);
    }

    loadMinistries();
  }, [
    churchId,
    isVolunteerOnly,
    isAdmin,
    ledMinistryIds,
    selectedMinistryId,
    supabase,
  ]);

  useEffect(() => {
    async function loadSchedules() {
      const shouldLoadVolunteer =
        selectionMode === "volunteer" && Boolean(selectedVolunteerId);
      const shouldLoadMinistry =
        selectionMode === "ministry" && Boolean(selectedMinistryId);

      if (!shouldLoadVolunteer && !shouldLoadMinistry) {
        setSchedules([]);
        return;
      }

      setLoadingSchedules(true);
      setError(null);

      const baseQuery = supabase
        .from("volunteer_slots")
        .select(
          "id, events!inner(id, title, date, start_time, location), ministries(id, name, color), profiles(name, email)",
        )
        .gte("events.date", monthRange.startStr)
        .lte("events.date", monthRange.endStr);

      const query =
        selectionMode === "volunteer"
          ? baseQuery.eq("user_id", selectedVolunteerId)
          : baseQuery.eq("ministry_id", selectedMinistryId);

      const { data, error } = await query;

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
        volunteerName: row.profiles?.name || null,
        volunteerEmail: row.profiles?.email || null,
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
  }, [
    supabase,
    selectionMode,
    selectedVolunteerId,
    selectedMinistryId,
    monthRange,
  ]);

  async function handleGenerateMinistryReport() {
    if (!selectedMinistryId) {
      setError("Selecione um ministério para gerar o relatório.");
      return;
    }

    setGeneratingReport(true);
    setError(null);

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("volunteer_slots")
      .select(
        "id, events!inner(title, date, start_time, location), profiles(name, email), ministries(name)",
      )
      .eq("ministry_id", selectedMinistryId)
      .gte("events.date", startStr)
      .lte("events.date", endStr);

    if (error) {
      setError("Erro ao gerar relatório. Tente novamente.");
      setGeneratingReport(false);
      return;
    }

    if (!data || data.length === 0) {
      setError("Nenhuma escala encontrada para esse ministério no mês atual.");
      setGeneratingReport(false);
      return;
    }

    const firstRowMinistry = Array.isArray(data[0]?.ministries)
      ? data[0]?.ministries[0]?.name
      : (data[0] as any)?.ministries?.name;

    const ministryName =
      ministries.find((item) => item.id === selectedMinistryId)?.name ||
      firstRowMinistry ||
      "Ministério";

    const monthLabel = now.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    generateMinistryMonthlySchedulesPdf({
      ministryName,
      monthLabel,
      items: data.map((row: any) => ({
        volunteerName: row.profiles?.name || "Voluntário sem nome",
        volunteerEmail: row.profiles?.email || "-",
        eventTitle: row.events?.title || "Evento sem título",
        eventDate: row.events?.date || "",
        eventStartTime: row.events?.start_time,
        eventLocation: row.events?.location,
      })),
    });

    setGeneratingReport(false);
  }

  function handleSelectionModeChange(value: SelectionMode) {
    setSelectionMode(value);
    setError(null);
    setSchedules([]);
  }

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
            {canChooseMinistry && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Exibir por</p>
                <Select
                  value={selectionMode}
                  onValueChange={(value) =>
                    handleSelectionModeChange(value as SelectionMode)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volunteer">Voluntário</SelectItem>
                    <SelectItem value="ministry">Ministério</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                {selectionMode === "volunteer" ? (
                  <>
                    <UserRound className="h-4 w-4 text-primary" />
                    Voluntário
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 text-primary" />
                    Ministério
                  </>
                )}
              </p>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-10 w-full animate-pulse rounded-lg border border-input bg-muted/40" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              ) : selectionMode === "volunteer" ? (
                <VolunteerSearch
                  volunteers={volunteers}
                  selectedVolunteerId={selectedVolunteerId}
                  onSelectVolunteer={setSelectedVolunteerId}
                  searchTerm={isVolunteerOnly ? undefined : searchTerm}
                  onSearchTermChange={
                    isVolunteerOnly ? undefined : setSearchTerm
                  }
                  loading={loadingVolunteers}
                  showEventStats={false}
                  showLabel={false}
                />
              ) : loadingMinistries ? (
                <div className="h-10 w-full animate-pulse rounded-lg border border-input bg-muted/40" />
              ) : ministries.length > 0 ? (
                <Select
                  value={selectedMinistryId}
                  onValueChange={setSelectedMinistryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ministério" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries.map((ministry) => (
                      <SelectItem key={ministry.id} value={ministry.id}>
                        {ministry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum ministério disponível.
                </p>
              )}

              {!loading &&
                selectionMode === "volunteer" &&
                !isVolunteerOnly &&
                canChooseMinistry &&
                volunteers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {searchTerm.trim()
                      ? "Nenhum voluntário encontrado com esse termo."
                      : "Digite para buscar voluntários."}
                  </p>
                )}
            </div>
          </div>

          {selectionMode === "ministry" && selectedMinistryId && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleGenerateMinistryReport}
                disabled={generatingReport || loadingSchedules}
              >
                <Download className="mr-2 h-4 w-4" />
                {generatingReport
                  ? "Gerando relatório..."
                  : "Gerar relatório do mês atual"}
              </Button>
            </div>
          )}
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
              description={
                selectionMode === "volunteer"
                  ? "Não há escalas para o voluntário selecionado neste mês."
                  : "Não há escalas para o ministério selecionado neste mês."
              }
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
