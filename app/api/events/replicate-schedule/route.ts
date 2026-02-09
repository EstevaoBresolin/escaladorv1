import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { sourceEventId, targetEventId, ministryId } = await request.json();

    // Validate required fields
    if (!sourceEventId || !targetEventId || !ministryId) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verify user is a leader of the specified ministry
    const { data: leaderCheck } = await supabase
      .from("ministry_leaders")
      .select("id")
      .eq("user_id", user.id)
      .eq("ministry_id", ministryId)
      .single();

    // Also check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    if (!leaderCheck && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para replicar escalas deste ministério" },
        { status: 403 }
      );
    }

    // Verify both events exist and the ministry is involved in both
    const { data: sourceEvent } = await supabase
      .from("events")
      .select(
        `
        id,
        event_ministries!inner(ministry_id)
      `
      )
      .eq("id", sourceEventId)
      .eq("event_ministries.ministry_id", ministryId)
      .single();

    if (!sourceEvent) {
      return NextResponse.json(
        { error: "Evento de origem não encontrado ou ministério não está envolvido" },
        { status: 404 }
      );
    }

    const { data: targetEvent } = await supabase
      .from("events")
      .select(
        `
        id,
        event_ministries!inner(ministry_id)
      `
      )
      .eq("id", targetEventId)
      .eq("event_ministries.ministry_id", ministryId)
      .single();

    if (!targetEvent) {
      return NextResponse.json(
        { error: "Evento de destino não encontrado ou ministério não está envolvido" },
        { status: 404 }
      );
    }

    // Get volunteer slots from source event for the specified ministry
    const { data: sourceSlots, error: slotsError } = await supabase
      .from("volunteer_slots")
      .select("user_id, ministry_id, function_id, status")
      .eq("event_id", sourceEventId)
      .eq("ministry_id", ministryId);

    if (slotsError) {
      console.error("Error fetching source slots:", slotsError);
      return NextResponse.json(
        { error: "Erro ao buscar escalas do evento de origem" },
        { status: 500 }
      );
    }

    if (!sourceSlots || sourceSlots.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma escala encontrada no evento de origem para este ministério" },
        { status: 404 }
      );
    }

    // Check if target event already has slots for this ministry
    const { data: existingSlots } = await supabase
      .from("volunteer_slots")
      .select("id")
      .eq("event_id", targetEventId)
      .eq("ministry_id", ministryId);

    if (existingSlots && existingSlots.length > 0) {
      return NextResponse.json(
        { 
          error: "O evento de destino já possui escalas para este ministério. Remova-as antes de replicar.",
          existingSlots: existingSlots.length
        },
        { status: 409 }
      );
    }

    // Create new volunteer slots in target event
    const newSlots = sourceSlots.map((slot) => ({
      event_id: targetEventId,
      user_id: slot.user_id,
      ministry_id: slot.ministry_id,
      function_id: slot.function_id,
      status: slot.status,
    }));

    const { data: createdSlots, error: insertError } = await supabase
      .from("volunteer_slots")
      .insert(newSlots)
      .select();

    if (insertError) {
      console.error("Error inserting volunteer slots:", insertError);
      return NextResponse.json(
        { error: "Erro ao criar escalas no evento de destino" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Escala replicada com sucesso",
      slotsCreated: createdSlots?.length || 0,
    });
  } catch (error) {
    console.error("Error in replicate-schedule API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
