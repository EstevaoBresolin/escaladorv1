import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdminRole } from "@/lib/permissions";

export async function requireSuperAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, church_id")
    .eq("id", user.id)
    .single();

  if (!isSuperAdminRole(profile?.role)) {
    redirect("/dashboard");
  }

  return { supabase, user, profile };
}

export async function requireSuperAdminRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Nao autenticado." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!isSuperAdminRole(profile?.role)) {
    return {
      error: NextResponse.json(
        { error: "Acesso restrito ao superadmin." },
        { status: 403 },
      ),
    };
  }

  return { supabase, user, profile };
}