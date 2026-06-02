import { sendWhatsAppMessage, formatReminderMessage } from '@/lib/twilio'
import type {
  NotificationProvider,
  NotificationRecipient,
  EventReminder,
  SendResult,
  NotificationChannel,
} from './types'

export class WhatsAppNotificationProvider implements NotificationProvider {
  canSend(recipient: NotificationRecipient): boolean {
    return !!recipient.phone
  }

  getChannelType(): NotificationChannel {
    return 'whatsapp'
  }

  async send(
    recipient: NotificationRecipient,
    reminder: EventReminder
  ): Promise<SendResult> {
    if (!recipient.phone) {
      return {
        success: false,
        error: 'Recipient has no phone number',
      }
    }

    const message = formatReminderMessage(
      recipient.name,
      reminder.eventTitle,
      reminder.eventDate,
      reminder.eventTime,
      reminder.eventLocation,
      reminder.ministryName
    )

    try {
      const result = await sendWhatsAppMessage(recipient.phone, message)

      if (result.success) {
        return {
          success: true,
          messageId: result.sid,
        }
      }

      return {
        success: false,
        error: result.error,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        error: `Twilio error: ${message}`,
      }
    }
  }
}
