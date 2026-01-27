import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage, formatReminderMessage } from "@/lib/twilio"
import { NextResponse } from "next/server"

// Manual endpoint to send reminder for a specific event
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can send reminders" },
        { status: 403 }
      )
    }

    // Check if Twilio is configured
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_WHATSAPP_FROM
    ) {
      return NextResponse.json(
        { error: "Twilio nao configurado. Configure as variaveis de ambiente." },
        { status: 400 }
      )
    }

    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      )
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, date, start_time, location")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get all volunteer slots for this event
    const { data: slots, error: slotsError } = await supabase
      .from("volunteer_slots")
      .select(
        `
        id,
        status,
        profiles!inner(id, name, phone),
        ministries!inner(id, name)
      `
      )
      .eq("event_id", eventId)
      .in("status", ["confirmed", "pending"])

    if (slotsError) {
      return NextResponse.json({ error: slotsError.message }, { status: 500 })
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({
        message: "Nenhum voluntario escalado para este evento",
        sent: 0,
      })
    }

    // Send reminders
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as { volunteer: string; status: string; error?: string }[],
    }

    for (const slot of slots) {
      const profileData = slot.profiles as { id: string; name: string; phone: string | null }
      const ministry = slot.ministries as { id: string; name: string }

      if (!profileData.phone) {
        results.skipped++
        results.details.push({
          volunteer: profileData.name,
          status: "skipped",
          error: "Sem telefone cadastrado",
        })
        continue
      }

      const message = formatReminderMessage(
        profileData.name,
        event.title,
        event.date,
        event.start_time,
        event.location || undefined,
        ministry.name
      )

      const sendResult = await sendWhatsAppMessage(profileData.phone, message)

      if (sendResult.success) {
        results.sent++
        results.details.push({
          volunteer: profileData.name,
          status: "sent",
        })

        // Create notification record
        await supabase.from("notifications").insert({
          user_id: profileData.id,
          title: "Lembrete de Escala",
          message: `Voce foi lembrado sobre o evento "${event.title}".`,
          type: "info",
          sent_via: "whatsapp",
        })
      } else {
        results.failed++
        results.details.push({
          volunteer: profileData.name,
          status: "failed",
          error: sendResult.error,
        })
      }
    }

    return NextResponse.json({
      message: "Lembretes processados",
      event: event.title,
      ...results,
    })
  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
