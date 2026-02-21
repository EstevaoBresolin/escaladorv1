import { cache } from "react";
import { createClient } from "./server";

// Cache da sessão do usuário para evitar múltiplas chamadas
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Cache do perfil do usuário
export const getCachedProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, churches(*)")
    .eq("id", userId)
    .single();
  return profile;
});

// Cache das permissões do usuário
export const getCachedPermissions = cache(async (userId: string) => {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, church_id")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.role === "admin";

  // Buscar ministérios que o usuário lidera
  const { data: ledMinistries } = await supabase
    .from("ministry_leaders")
    .select("ministry_id")
    .eq("user_id", userId);

  const ledMinistryIds = ledMinistries?.map((m) => m.ministry_id) || [];
  const isLeader = ledMinistryIds.length > 0;

  return {
    isAdmin,
    isLeader,
    ledMinistryIds,
    churchId: profile?.church_id || null,
  };
});
