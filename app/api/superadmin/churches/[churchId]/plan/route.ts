import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdminRoute } from "@/lib/superadmin";

type Params = {
  params: Promise<{ churchId: string }>;
};

const schema = z.object({
  plan: z.union([z.literal(0), z.literal(1)]),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const context = await requireSuperAdminRoute();

  if ("error" in context) {
    return context.error;
  }

  const { churchId } = await params;
  const body = schema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json(
      { error: "Plano invalido. Use 0 ou 1." },
      { status: 400 },
    );
  }

  const { supabase } = context;
  const { data: church, error } = await supabase
    .from("churches")
    .update({ plan: body.data.plan })
    .eq("id", churchId)
    .select("id, name, plan")
    .single();

  if (error || !church) {
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar plano da igreja." },
      { status: 400 },
    );
  }

  return NextResponse.json({ church });
}