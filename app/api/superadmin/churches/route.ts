import { NextResponse } from "next/server";
import { requireSuperAdminRoute } from "@/lib/superadmin";

export async function GET() {
  const context = await requireSuperAdminRoute();

  if ("error" in context) {
    return context.error;
  }

  const { supabase } = context;
  const { data: churches, error } = await supabase
    .from("churches")
    .select("id, name, plan, active")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ churches: churches || [] });
}