import { SupabaseClient } from "@supabase/supabase-js";
import type { UserPermissions } from "./types";

export async function getUserPermissionsByProfile(
  supabase: SupabaseClient,
  userId: string,
  role: string | null | undefined,
): Promise<UserPermissions> {
  const isAdmin = role === "admin";

  const { data: ledMinistries } = await supabase
    .from("ministry_leaders")
    .select("ministry_id")
    .eq("user_id", userId);

  const ledMinistryIds = ledMinistries?.map((m) => m.ministry_id) || [];

  return {
    isAdmin,
    isLeader: ledMinistryIds.length > 0,
    ledMinistryIds,
  };
}

/**
 * Fetches the current user's permissions including their role and
 * which ministries they lead.
 */
export async function getUserPermissions(
  supabase: SupabaseClient,
): Promise<UserPermissions | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's profile and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return getUserPermissionsByProfile(supabase, user.id, profile.role);
}

/**
 * Gets the volunteers that a user can assign to an event based on their permissions.
 * - Admins can assign any volunteer from any ministry involved in the event.
 * - Ministry leaders can only assign volunteers from ministries they lead.
 */
export async function getAssignableVolunteers(
  supabase: SupabaseClient,
  eventMinistryIds: string[],
  permissions: UserPermissions,
): Promise<
  { id: string; name: string; email: string; ministryIds: string[] }[]
> {
  // Determine which ministry IDs the user can manage
  let managableMinistryIds: string[];

  if (permissions.isAdmin) {
    managableMinistryIds = eventMinistryIds;
  } else {
    // Leaders can only manage volunteers from their ministries
    managableMinistryIds = eventMinistryIds.filter((id) =>
      permissions.ledMinistryIds.includes(id),
    );
  }

  if (managableMinistryIds.length === 0) {
    return [];
  }

  // Get volunteers that belong to these ministries
  const { data: ministryVolunteers } = await supabase
    .from("user_ministries")
    .select("user_id, ministry_id, profiles(id, name, email)")
    .in("ministry_id", managableMinistryIds);

  // Group by volunteer and track which ministries they belong to
  const volunteersMap = new Map<
    string,
    { id: string; name: string; email: string; ministryIds: string[] }
  >();

  ministryVolunteers?.forEach((mv) => {
    const profileData = Array.isArray(mv.profiles)
      ? mv.profiles[0]
      : mv.profiles;

    if (profileData) {
      const existing = volunteersMap.get(profileData.id);
      if (existing) {
        existing.ministryIds.push(mv.ministry_id);
      } else {
        volunteersMap.set(profileData.id, {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          ministryIds: [mv.ministry_id],
        });
      }
    }
  });

  return Array.from(volunteersMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * Gets the ministries that a user can assign volunteers to for an event.
 */
export function getManageableMinistries(
  eventMinistryIds: string[],
  permissions: UserPermissions,
  allMinistries: { id: string; name: string; color: string }[],
): { id: string; name: string; color: string }[] {
  if (permissions.isAdmin) {
    return allMinistries.filter((m) => eventMinistryIds.includes(m.id));
  }

  return allMinistries.filter(
    (m) =>
      eventMinistryIds.includes(m.id) &&
      permissions.ledMinistryIds.includes(m.id),
  );
}
