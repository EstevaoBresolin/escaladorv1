import type {
  NotificationProvider,
  NotificationRecipient,
  EventReminder,
  SendResult,
  NotificationChannel,
} from './types'

// Resend API via fetch - sem dependencia de pacote externo
async function sendEmailViaResend(options: {
  from: string
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ data?: { id: string }; error?: { message: string } }> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    return {
      error: { message: result.message || 'Failed to send email' },
    }
  }

  return { data: { id: result.id } }
}

export function formatEmailHtml(
  volunteerName: string,
  reminder: EventReminder
): string {
  const formattedDate = new Date(reminder.eventDate + 'T12:00:00').toLocaleDateString(
    'pt-BR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  )

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lembrete de Escala</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="background-color: #18181b; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Lembrete de Escala</h1>
        </div>
        
        <div style="padding: 32px;">
          <p style="color: #18181b; font-size: 16px; margin: 0 0 24px 0;">
            Ola, <strong>${volunteerName}</strong>!
          </p>
          
          <p style="color: #52525b; font-size: 15px; margin: 0 0 24px 0;">
            Este e um lembrete de que voce esta escalado(a) para <strong>amanha</strong>:
          </p>
          
          <div style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
            <h2 style="color: #18181b; font-size: 18px; margin: 0 0 16px 0;">
              ${reminder.eventTitle}
            </h2>
            
            <div style="color: #52525b; font-size: 14px;">
              <p style="margin: 8px 0;">
                <strong>Data:</strong> ${formattedDate}
              </p>
              <p style="margin: 8px 0;">
                <strong>Horario:</strong> ${reminder.eventTime.slice(0, 5)}
              </p>
              ${reminder.eventLocation ? `
              <p style="margin: 8px 0;">
                <strong>Local:</strong> ${reminder.eventLocation}
              </p>
              ` : ''}
              <p style="margin: 8px 0;">
                <strong>Ministerio:</strong> ${reminder.ministryName}
              </p>
            </div>
          </div>
          
          <p style="color: #52525b; font-size: 15px; margin: 0;">
            Contamos com voce! Deus abencoe.
          </p>
        </div>
        
        <div style="background-color: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #e4e4e7;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
            Conecte Escalas - Sistema de Gerenciamento de Voluntarios
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function formatEmailText(
  volunteerName: string,
  reminder: EventReminder
): string {
  const formattedDate = new Date(reminder.eventDate + 'T12:00:00').toLocaleDateString(
    'pt-BR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }
  )

  let message = `Ola ${volunteerName}!\n\n`
  message += `Este e um lembrete de que voce esta escalado(a) para amanha:\n\n`
  message += `EVENTO: ${reminder.eventTitle}\n`
  message += `DATA: ${formattedDate}\n`
  message += `HORARIO: ${reminder.eventTime.slice(0, 5)}\n`

  if (reminder.eventLocation) {
    message += `LOCAL: ${reminder.eventLocation}\n`
  }

  message += `MINISTERIO: ${reminder.ministryName}\n`
  message += `\nContamos com voce! Deus abencoe.\n`
  message += `\n---\nConecte Escalas`

  return message
}

export class EmailNotificationProvider implements NotificationProvider {
  private fromEmail: string

  constructor() {
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@conecteescalas.com'
  }

  canSend(recipient: NotificationRecipient): boolean {
    return !!recipient.email
  }

  getChannelType(): NotificationChannel {
    return 'email'
  }

  async send(
    recipient: NotificationRecipient,
    reminder: EventReminder
  ): Promise<SendResult> {
    if (!recipient.email) {
      return {
        success: false,
        error: 'Recipient has no email address',
      }
    }

    try {
      const result = await sendEmailViaResend({
        from: this.fromEmail,
        to: recipient.email,
        subject: `Lembrete: ${reminder.eventTitle} - Amanha`,
        html: formatEmailHtml(recipient.name, reminder),
        text: formatEmailText(recipient.name, reminder),
      })

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        }
      }

      return {
        success: true,
        messageId: result.data?.id,
      }
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
