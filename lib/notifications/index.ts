import { EmailNotificationProvider } from "./email-provider";
import { WhatsAppNotificationProvider } from "./whatsapp-provider";
import { getRateLimiter, RateLimiter } from "./rate-limiter";
import type {
  NotificationProvider,
  NotificationRecipient,
  EventReminder,
  SendResult,
  NotificationChannel,
  NotificationConfig,
} from "./types";
import { DEFAULT_NOTIFICATION_CONFIG } from "./types";

export * from "./types";
export * from "./rate-limiter";

// Factory to get the appropriate provider
function getProvider(channel: NotificationChannel): NotificationProvider {
  switch (channel) {
    case "email":
      return new EmailNotificationProvider();
    case "whatsapp":
      return new WhatsAppNotificationProvider();
    default:
      throw new Error(`Unknown notification channel: ${channel}`);
  }
}

// Check if a channel is configured
export function isChannelConfigured(channel: NotificationChannel): boolean {
  switch (channel) {
    case "email":
      return !!process.env.RESEND_API_KEY;
    case "whatsapp":
      return !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_FROM
      );
    default:
      return false;
  }
}

// Get the active channel based on configuration
export function getActiveChannel(
  config: NotificationConfig = DEFAULT_NOTIFICATION_CONFIG,
): NotificationChannel | null {
  if (isChannelConfigured(config.primaryChannel)) {
    return config.primaryChannel;
  }

  if (
    config.enableFallback &&
    config.fallbackChannel &&
    isChannelConfigured(config.fallbackChannel)
  ) {
    return config.fallbackChannel;
  }

  return null;
}

// Main notification service
export class NotificationService {
  private config: NotificationConfig;
  private primaryProvider: NotificationProvider | null = null;
  private fallbackProvider: NotificationProvider | null = null;
  private rateLimiter: RateLimiter;

  constructor(config: NotificationConfig = DEFAULT_NOTIFICATION_CONFIG) {
    this.config = config;
    this.rateLimiter = getRateLimiter(2); // 2 requests per second

    if (isChannelConfigured(config.primaryChannel)) {
      this.primaryProvider = getProvider(config.primaryChannel);
    }

    if (
      config.enableFallback &&
      config.fallbackChannel &&
      isChannelConfigured(config.fallbackChannel)
    ) {
      this.fallbackProvider = getProvider(config.fallbackChannel);
    }
  }

  isConfigured(): boolean {
    return this.primaryProvider !== null;
  }

  getActiveChannel(): NotificationChannel | null {
    return this.primaryProvider?.getChannelType() || null;
  }

  async sendReminder(
    recipient: NotificationRecipient,
    reminder: EventReminder,
  ): Promise<SendResult & { channel?: NotificationChannel }> {
    // Encapsula o envio no rate limiter
    return this.rateLimiter.execute(async () => {
      // Try primary provider
      if (this.primaryProvider && this.primaryProvider.canSend(recipient)) {
        const result = await this.primaryProvider.send(recipient, reminder);

        if (result.success) {
          return {
            ...result,
            channel: this.primaryProvider.getChannelType(),
          };
        }

        // If primary failed and fallback is enabled, try fallback
        if (this.config.enableFallback && this.fallbackProvider) {
          console.log(
            `Primary channel (${this.primaryProvider.getChannelType()}) failed, trying fallback...`,
          );
        } else {
          return {
            ...result,
            channel: this.primaryProvider.getChannelType(),
          };
        }
      }

      // Try fallback provider
      if (this.fallbackProvider && this.fallbackProvider.canSend(recipient)) {
        const result = await this.fallbackProvider.send(recipient, reminder);
        return {
          ...result,
          channel: this.fallbackProvider.getChannelType(),
        };
      }

      // No provider could send
      const reasons: string[] = [];

      if (!this.primaryProvider) {
        reasons.push(`${this.config.primaryChannel} not configured`);
      } else if (!this.primaryProvider.canSend(recipient)) {
        reasons.push(
          `recipient missing ${this.config.primaryChannel === "email" ? "email" : "phone"}`,
        );
      }

      if (this.config.enableFallback) {
        if (!this.fallbackProvider) {
          reasons.push(`${this.config.fallbackChannel} not configured`);
        } else if (!this.fallbackProvider.canSend(recipient)) {
          reasons.push(
            `recipient missing ${this.config.fallbackChannel === "email" ? "email" : "phone"}`,
          );
        }
      }

      return {
        success: false,
        error: reasons.join(", "),
      };
    });
  }
}

// Singleton instance for convenience
let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(
  config?: NotificationConfig,
): NotificationService {
  if (!notificationServiceInstance || config) {
    notificationServiceInstance = new NotificationService(
      config || DEFAULT_NOTIFICATION_CONFIG,
    );
  }
  return notificationServiceInstance;
}
