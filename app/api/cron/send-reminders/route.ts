import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage, formatReminderMessage } from "@/lib/twilio"
import { NextResponse } from "next/server"

// This endpoint is called by Vercel Cron to send WhatsApp reminders
// for volunteers scheduled for events tomorrow

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if Twilio is configured
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_WHATSAPP_FROM
  ) {
    return NextResponse.json(
      { error: "Twilio not configured", sent: 0 },
      { status: 200 }
    )
  }

  try {
    const supabase = await createClient()

    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    // Get all volunteer slots for tomorrow's events with status confirmed or pending
    const { data: slots, error } = await supabase
      .from("volunteer_slots")
      .select(
        `
        id,
        status,
        user_id,
        profiles!inner(id, name, phone),
        events!inner(id, title, date, start_time, location),
        ministries!inner(id, name)
      `
      )
      .eq("events.date", tomorrowStr)
      .in("status", ["confirmed", "pending"])

    if (error) {
      console.error("Error fetching volunteer slots:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({
        message: "No volunteers scheduled for tomorrow",
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
      const profile = slot.profiles as { id: string; name: string; phone: string | null }
      const event = slot.events as { id: string; title: string; date: string; start_time: string; location: string | null }
      const ministry = slot.ministries as { id: string; name: string }

      // Skip if no phone number
      if (!profile.phone) {
        results.skipped++
        results.details.push({
          volunteer: profile.name,
          status: "skipped",
          error: "No phone number",
        })
        continue
      }

      const message = formatReminderMessage(
        profile.name,
        event.title,
        event.date,
        event.start_time,
        event.location || undefined,
        ministry.name
      )

      const sendResult = await sendWhatsAppMessage(profile.phone, message)

      if (sendResult.success) {
        results.sent++
        results.details.push({
          volunteer: profile.name,
          status: "sent",
        })

        // Create notification record
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "Lembrete de Escala",
          message: `Voce foi lembrado sobre o evento "${event.title}" de amanha.`,
          type: "info",
          sent_via: "whatsapp",
        })
      } else {
        results.failed++
        results.details.push({
          volunteer: profile.name,
          status: "failed",
          error: sendResult.error,
        })
      }
    }

    return NextResponse.json({
      message: "Reminders processed",
      date: tomorrowStr,
      ...results,
    })
  } catch (error) {
    console.error("Error in send-reminders cron:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
