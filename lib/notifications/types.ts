// Notification system types
// This abstraction makes it easy to switch between email and WhatsApp

export type NotificationChannel = 'email' | 'whatsapp'

export interface NotificationRecipient {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

export interface EventReminder {
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation?: string
  ministryName: string
}

export interface SendResult {
  success: boolean
  error?: string
  messageId?: string
}

export interface NotificationProvider {
  send(
    recipient: NotificationRecipient,
    reminder: EventReminder
  ): Promise<SendResult>
  
  canSend(recipient: NotificationRecipient): boolean
  
  getChannelType(): NotificationChannel
}

// Configuration for which channel to use
export interface NotificationConfig {
  // The primary channel to use for sending notifications
  primaryChannel: NotificationChannel
  // Whether to fallback to another channel if primary fails
  enableFallback: boolean
  // The fallback channel (if enabled)
  fallbackChannel?: NotificationChannel
}

// Default configuration - easy to change here
export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  // Change this to 'whatsapp' when you want to switch
  primaryChannel: 'email',
  enableFallback: false,
  fallbackChannel: 'whatsapp',
}
