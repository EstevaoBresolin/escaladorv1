import twilio from "twilio"

// Twilio client singleton
let twilioClient: ReturnType<typeof twilio> | null = null

export function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured")
    }

    twilioClient = twilio(accountSid, authToken)
  }

  return twilioClient
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const client = getTwilioClient()
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!from) {
    throw new Error("TWILIO_WHATSAPP_FROM not configured")
  }

  // Format phone number for WhatsApp
  const formattedTo = formatPhoneForWhatsApp(to)

  try {
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${from}`,
      to: `whatsapp:${formattedTo}`,
    })

    return {
      success: true,
      sid: result.sid,
      status: result.status,
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "")

  // If starts with 0, remove it
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1)
  }

  // If doesn't start with country code, assume Brazil (+55)
  if (!cleaned.startsWith("55") && cleaned.length <= 11) {
    cleaned = `55${cleaned}`
  }

  return `+${cleaned}`
}

export function formatReminderMessage(
  volunteerName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation?: string,
  ministryName?: string
): string {
  const formattedDate = new Date(eventDate + "T12:00:00").toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  )

  let message = `Ola ${volunteerName}! 🙏\n\n`
  message += `Este e um lembrete de que voce esta escalado(a) para amanha:\n\n`
  message += `📅 *${eventTitle}*\n`
  message += `🗓 ${formattedDate}\n`
  message += `🕐 ${eventTime.slice(0, 5)}\n`

  if (eventLocation) {
    message += `📍 ${eventLocation}\n`
  }

  if (ministryName) {
    message += `⛪ Ministerio: ${ministryName}\n`
  }

  message += `\nContamos com voce! Deus abencoe.`

  return message
}
