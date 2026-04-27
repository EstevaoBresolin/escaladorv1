import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminRoute } from "@/lib/superadmin";

type Params = {
  params: Promise<{ churchId: string }>;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

type MinistryRow = {
  id: string;
  name: string;
};

type UserMinistryRow = {
  user_id: string;
  ministry_id: string;
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
      .select("id, name")
      .eq("id", churchId)
      .single(),
    supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("church_id", churchId)
      .order("name"),
    supabase
      .from("ministries")
      .select("id, name")
      .eq("church_id", churchId),
  ]);

  if (churchResult.error || !churchResult.data) {
    return NextResponse.json(
      { error: churchResult.error?.message || "Igreja nao encontrada." },
      { status: 404 },
    );
  }

  if (profilesResult.error || ministriesResult.error) {
    return NextResponse.json(
      {
        error:
          profilesResult.error?.message ||
          ministriesResult.error?.message ||
          "Erro ao carregar membros da igreja.",
      },
      { status: 400 },
    );
  }

  const profiles = (profilesResult.data || []) as ProfileRow[];
  const ministries = (ministriesResult.data || []) as MinistryRow[];
  const ministryIds = ministries.map((ministry) => ministry.id);
  const ministryNameById = new Map(
    ministries.map((ministry) => [ministry.id, ministry.name]),
  );

  const userMinistriesResult =
    profiles.length > 0 && ministryIds.length > 0
      ? await supabase
          .from("user_ministries")
          .select("user_id, ministry_id")
          .in("user_id", profiles.map((profile) => profile.id))
          .in("ministry_id", ministryIds)
      : { data: [], error: null };

  if (userMinistriesResult.error) {
    return NextResponse.json(
      { error: userMinistriesResult.error.message },
      { status: 400 },
    );
  }

  const ministriesByUser = new Map<string, Set<string>>();

  for (const userMinistry of (userMinistriesResult.data || []) as UserMinistryRow[]) {
    const ministryName = ministryNameById.get(userMinistry.ministry_id);
    if (!ministryName) {
      continue;
    }

    const userMinistries = ministriesByUser.get(userMinistry.user_id) || new Set<string>();
    userMinistries.add(ministryName);
    ministriesByUser.set(userMinistry.user_id, userMinistries);
  }

  const members = profiles.map((profile) => {
    const userMinistries = Array.from(ministriesByUser.get(profile.id) || []);

    return {
      id: profile.id,
      name: profile.name || "Usuario sem nome",
      email: profile.email || "",
      role: profile.role,
      hasMinistry: userMinistries.length > 0,
      ministryCount: userMinistries.length,
      ministries: userMinistries,
    };
  });

  return NextResponse.json({
    church: {
      id: churchResult.data.id,
      name: churchResult.data.name,
    },
    members,
    summary: {
      totalMembers: members.length,
      withoutMinistry: members.filter((member) => !member.hasMinistry).length,
    },
  });
}
