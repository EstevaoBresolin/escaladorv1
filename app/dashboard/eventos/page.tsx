import { createClient } from "@/lib/supabase/server";
import { EventsPageClient } from "../../../components/dashboard/eventos-page-client";
import {
  getCachedPermissions,
  getCachedProfile,
  getCachedUser,
} from "@/lib/supabase/cache";

export default async function EventosPage() {
  const supabase = await createClient();
  const user = await getCachedUser();

  if (!user) {
    return null;
  }

  const profile = await getCachedProfile(user.id);

  // Get user permissions
  const permissions = await getCachedPermissions(user.id);
  const isAdmin = permissions?.isAdmin || false;
  const ledMinistryIds = permissions?.ledMinistryIds || [];

  const { data: eventsRaw } = await supabase
    .from("events")
    .select(
      `
      id,
      church_id,
      title,
      description,
      date,
      start_time,
      location,
      event_ministries(ministry_id, ministries(id, name, color)),
      volunteer_slots(count)
    `,
    )
    .eq("church_id", profile?.church_id)
    .order("date", { ascending: true });

  const events = (eventsRaw || []).map((event: any) => ({
    id: event.id,
    church_id: event.church_id,
    title: event.title,
    description: event.description,
    date: event.date,
    start_time: event.start_time,
    location: event.location,
    has_schedules:
      ((event.volunteer_slots || [])[0] as { count?: number } | undefined)
        ?.count > 0,
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
      ledMinistryIds={ledMinistryIds}
    />
  );
}
