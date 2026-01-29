import { createClient } from "@/lib/supabase/server"
import { getNotificationService } from "@/lib/notifications"
import type { NotificationRecipient, EventReminder } from "@/lib/notifications"
import { NextResponse } from "next/server"

// Manual endpoint to send reminder for a specific event
// Uses the same notification service as the cron job
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

    // Initialize notification service
    const notificationService = getNotificationService()

    if (!notificationService.isConfigured()) {
      return NextResponse.json(
        {
          error:
            "Sistema de notificacao nao configurado. Configure RESEND_API_KEY para email ou variaveis do Twilio para WhatsApp.",
        },
        { status: 400 }
      )
    }

    const activeChannel = notificationService.getActiveChannel()

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
        profiles!inner(id, name, email, phone),
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
      details: [] as {
        volunteer: string
        status: string
        channel?: string
        error?: string
      }[],
    }

    for (const slot of slots) {
      const profileData = slot.profiles as {
        id: string
        name: string
        email: string | null
        phone: string | null
      }
      const ministry = slot.ministries as { id: string; name: string }

      // Prepare recipient and reminder data
      const recipient: NotificationRecipient = {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      }

      const reminder: EventReminder = {
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.start_time,
        eventLocation: event.location || undefined,
        ministryName: ministry.name,
      }

      // Send notification
      const sendResult = await notificationService.sendReminder(
        recipient,
        reminder
      )

      if (sendResult.success) {
        results.sent++
        results.details.push({
          volunteer: profileData.name,
          status: "sent",
          channel: sendResult.channel,
        })

        // Create notification record
        await supabase.from("notifications").insert({
          user_id: profileData.id,
          title: "Lembrete de Escala",
          message: `Voce foi lembrado sobre o evento "${event.title}".`,
          type: "info",
          sent_via: sendResult.channel,
        })
      } else {
        // Check if it's a missing contact info issue
        const isMissingContact =
          sendResult.error?.includes("missing") ||
          sendResult.error?.includes("no email") ||
          sendResult.error?.includes("no phone")

        if (isMissingContact) {
          results.skipped++
          results.details.push({
            volunteer: profileData.name,
            status: "skipped",
            error:
              activeChannel === "email"
                ? "Sem email cadastrado"
                : "Sem telefone cadastrado",
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
    }

    return NextResponse.json({
      message: "Lembretes processados",
      event: event.title,
      channel: activeChannel,
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
