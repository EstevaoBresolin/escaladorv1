import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminRoute } from "@/lib/superadmin";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  church_id: string | null;
  churches: { name: string | null } | { name: string | null }[] | null;
};

export async function GET(request: NextRequest) {
  const context = await requireSuperAdminRoute();

  if ("error" in context) {
    return context.error;
  }

  const { supabase } = context;
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  const churchId = request.nextUrl.searchParams.get("churchId")?.trim() || "";

  const baseQuery = () => {
    let next = supabase
      .from("profiles")
      .select("id, name, email, role, church_id, churches(name)")
      .order("name")
      .limit(30);

    if (churchId) {
      next = next.eq("church_id", churchId);
    }

    return next;
  };

  const shouldSearch = query.length >= 2;

  const [nameResult, emailResult] = shouldSearch
    ? await Promise.all([
        baseQuery().ilike("name", `%${query}%`),
        baseQuery().ilike("email", `%${query}%`),
      ])
    : [await baseQuery(), { data: [], error: null }];

  if (nameResult.error || emailResult.error) {
    return NextResponse.json(
      {
        error:
          nameResult.error?.message ||
          emailResult.error?.message ||
          "Erro ao buscar usuarios.",
      },
      { status: 400 },
    );
  }

  const mergedUsers = new Map<string, UserRow>();

  for (const user of [...(nameResult.data || []), ...(emailResult.data || [])] as UserRow[]) {
    mergedUsers.set(user.id, user);
  }

  const users = Array.from(mergedUsers.values());
  const userIds = users.map((user) => user.id);

  const userMinistriesResult = userIds.length
    ? await supabase.from("user_ministries").select("user_id").in("user_id", userIds)
    : { data: [], error: null };

  if (userMinistriesResult.error) {
    return NextResponse.json(
      { error: userMinistriesResult.error.message },
      { status: 400 },
    );
  }

  const ministryCountByUser = new Map<string, number>();

  for (const item of userMinistriesResult.data || []) {
    ministryCountByUser.set(item.user_id, (ministryCountByUser.get(item.user_id) || 0) + 1);
  }

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name || "Usuário sem nome",
      email: user.email || "",
      role: user.role,
      churchId: user.church_id,
      churchName: Array.isArray(user.churches)
        ? user.churches[0]?.name || null
        : user.churches?.name || null,
      ministryCount: ministryCountByUser.get(user.id) || 0,
      hasMinistry: ministryCountByUser.has(user.id),
    })),
  });
}