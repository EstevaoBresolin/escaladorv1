import { createClient } from "@/lib/supabase/server"
import { getNotificationService } from "@/lib/notifications"
import type { NotificationRecipient, EventReminder } from "@/lib/notifications"
import { NextResponse } from "next/server"

// This endpoint is called by Vercel Cron every day at 10:00 AM (Brasilia time / UTC-3)
// to send reminders to volunteers scheduled for events tomorrow.
//
// The notification channel (email or WhatsApp) is configured in /lib/notifications/types.ts
// To switch from email to WhatsApp, simply change DEFAULT_NOTIFICATION_CONFIG.primaryChannel

export async function GET(request: Request) {
  // Verify request is from Vercel Cron or has valid secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  
  // Vercel Cron sends a special header to authenticate
  const isVercelCron = request.headers.get("user-agent")?.includes("vercel-cron")
  
  // Allow if: 1) It's from Vercel Cron, OR 2) Has valid CRON_SECRET
  const isAuthorized = isVercelCron || 
    (cronSecret && authHeader === `Bearer ${cronSecret}`)

  if (!isAuthorized && cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Initialize notification service
  const notificationService = getNotificationService()

  if (!notificationService.isConfigured()) {
    return NextResponse.json(
      {
        error: "Notification service not configured",
        hint: "Configure RESEND_API_KEY for email or Twilio environment variables for WhatsApp",
        sent: 0,
      },
      { status: 200 }
    )
  }

  const activeChannel = notificationService.getActiveChannel()

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
        profiles!inner(id, name, email, phone),
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
        channel: activeChannel,
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
      const profile = slot.profiles as {
        id: string
        name: string
        email: string | null
        phone: string | null
      }
      const event = slot.events as {
        id: string
        title: string
        date: string
        start_time: string
        location: string | null
      }
      const ministry = slot.ministries as { id: string; name: string }

      // Prepare recipient and reminder data
      const recipient: NotificationRecipient = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
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
          volunteer: profile.name,
          status: "sent",
          channel: sendResult.channel,
        })

        // Create notification record
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "Lembrete de Escala",
          message: `Voce foi lembrado sobre o evento "${event.title}" de amanha.`,
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
            volunteer: profile.name,
            status: "skipped",
            error: sendResult.error,
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
    }

    return NextResponse.json({
      message: "Reminders processed",
      date: tomorrowStr,
      channel: activeChannel,
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
