import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdminRoute } from "@/lib/superadmin";

type Params = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(_request: NextRequest, { params }: Params) {
  const context = await requireSuperAdminRoute();

  if ("error" in context) {
    return context.error;
  }

  const { userId } = await params;
  const { supabase } = context;

  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, church_id")
    .eq("id", userId)
    .single();

  if (profileError || !targetProfile) {
    return NextResponse.json(
      { error: profileError?.message || "Usuario nao encontrado." },
      { status: 404 },
    );
  }

  if (targetProfile.role === "superadmin") {
    return NextResponse.json(
      { error: "Nao e permitido alterar a role de outro superadmin." },
      { status: 400 },
    );
  }

  const body = (await _request.json().catch(() => ({}))) as {
    role?: string;
  };
  const requestedRole = body.role === "member" ? "member" : "admin";

  if (requestedRole === "admin" && !targetProfile.church_id) {
    return NextResponse.json(
      { error: "O usuario precisa pertencer a uma igreja para virar admin." },
      { status: 400 },
    );
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({ role: requestedRole })
    .eq("id", userId)
    .select("id, role, church_id")
    .single();

  if (error || !updatedProfile) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          (requestedRole === "admin"
            ? "Erro ao promover usuario."
            : "Erro ao remover permissao de admin."),
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ profile: updatedProfile });
}