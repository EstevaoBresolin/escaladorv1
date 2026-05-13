import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminRoute } from "@/lib/superadmin";

type Params = {
  params: Promise<{ churchId: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const context = await requireSuperAdminRoute();

  if ("error" in context) {
    return context.error;
  }

  const { churchId } = await params;
  const { supabase } = context;

  const [churchResult, profilesResult, ministriesResult] = await Promise.all([
    supabase
      .from("churches")
      .select("id, name, plan, active")
      .eq("id", churchId)
      .single(),
    supabase
      .from("profiles")
      .select("id, role")
      .eq("church_id", churchId),
    supabase
      .from("ministries")
      .select("id")
      .eq("church_id", churchId),
  ]);

  if (churchResult.error || !churchResult.data) {
    return NextResponse.json(
      { error: churchResult.error?.message || "Igreja nao encontrada." },
      { status: 404 },
    );
  }

  const ministryIds = (ministriesResult.data || []).map((ministry) => ministry.id);
  const userMinistriesResult = ministryIds.length
    ? await supabase
        .from("user_ministries")
        .select("user_id")
        .in("ministry_id", ministryIds)
    : { data: [], error: null };

  if (
    profilesResult.error ||
    ministriesResult.error ||
    userMinistriesResult.error
  ) {
    return NextResponse.json(
      {
        error:
          profilesResult.error?.message ||
          ministriesResult.error?.message ||
          userMinistriesResult.error?.message ||
          "Erro ao carregar dados da igreja.",
      },
      { status: 400 },
    );
  }

  const profiles = profilesResult.data || [];
  const activeUserIds = new Set(
    (userMinistriesResult.data || []).map((item) => item.user_id),
  );

  return NextResponse.json({
    church: {
      id: churchResult.data.id,
      name: churchResult.data.name,
      plan: churchResult.data.plan ?? 0,
      active: churchResult.data.active ?? true,
    },
    stats: {
      totalUsers: profiles.length,
      totalAdmins: profiles.filter((profile) => profile.role === "admin").length,
      totalMinistries: ministryIds.length,
      activeUsers: profiles.filter((profile) => activeUserIds.has(profile.id)).length,
      usersWithoutMinistry: profiles.filter(
        (profile) => !activeUserIds.has(profile.id),
      ).length,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const context = await requireSuperAdminRoute();

  if ("error" in context) {
    return context.error;
  }

  const { churchId } = await params;

  const body = (await request.json().catch(() => null)) as
    | { active?: boolean }
    | null;

  if (typeof body?.active !== "boolean") {
    return NextResponse.json(
      { error: "Campo active e obrigatorio." },
      { status: 400 },
    );
  }

  const { supabase } = context;
  const { data: church, error } = await supabase
    .from("churches")
    .update({ active: body.active, updated_at: new Date().toISOString() })
    .eq("id", churchId)
    .select("id, name, plan, active")
    .single();

  if (error || !church) {
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar igreja." },
      { status: 400 },
    );
  }

  return NextResponse.json({ church });
}