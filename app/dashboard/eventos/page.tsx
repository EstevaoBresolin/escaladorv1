import { createClient } from "@/lib/supabase/server";
import { getUserPermissions } from "@/lib/permissions";
import { EventsPageClient } from "@/components/dashboard/eventos-page-client";

export default async function EventosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("church_id")
    .eq("id", user?.id)
    .single();

  // Get user permissions
  const permissions = await getUserPermissions(supabase);
  const isAdmin = permissions?.isAdmin || false;
  const isLeader = permissions?.isLeader || false;
  const ledMinistryIds = permissions?.ledMinistryIds || [];

  const { data: eventsRaw } = await supabase
    .from("events")
    .select(
      `
      id,
      title,
      date,
      start_time,
      location,
      event_ministries(ministry_id, ministries(id, name, color))
    `,
    )
    .eq("church_id", profile?.church_id)
    .order("date", { ascending: true });

  const events = (eventsRaw || []).map((event: any) => ({
    id: event.id,
    title: event.title,
    date: event.date,
    start_time: event.start_time,
    location: event.location,
    event_ministries: (event.event_ministries || []).map((em: any) => ({
      ministry_id: em.ministry_id,
      ministries: Array.isArray(em.ministries)
        ? em.ministries[0]
        : em.ministries,
    })),
  }));

  return (
    <EventsPageClient
      events={events || []}
      isAdmin={isAdmin}
      isLeader={isLeader}
      ledMinistryIds={ledMinistryIds}
    />
  );
}
