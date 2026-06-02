import { hasUpstashConfig, upstashCommand } from "@/lib/security/upstash";

const WINDOW_SECONDS = 60; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 5;

export type LoginRateLimitStatus = {
  blocked: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
};

export function buildLoginKey(
  email: string,
  fingerprint?: string,
): string {
  const safeFingerprint = fingerprint?.trim().toLowerCase() || "na";
  // Key by email only — IP is not included because X-Forwarded-For is spoofable
  // and would allow an attacker to bypass the limit by rotating IPs.
  return `rl:login:${email.trim().toLowerCase()}::${safeFingerprint}`;
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function buildRequestFingerprint(headers: Headers): string {
  const userAgent = headers.get("user-agent") || "unknown-agent";
  const acceptLanguage = headers.get("accept-language") || "unknown-lang";
  return `${userAgent.slice(0, 120)}::${acceptLanguage.slice(0, 40)}`;
}

export async function getLoginFailureStatus(
  key: string,
): Promise<LoginRateLimitStatus> {
  if (!hasUpstashConfig()) {
    return {
      blocked: false,
      retryAfterSeconds: 0,
      remainingAttempts: MAX_ATTEMPTS_PER_WINDOW,
    };
  }

  try {
    const attempts = Number(
      (await upstashCommand<string | null>(["GET", key])) || 0,
    );
    const ttl = Math.max(Number(await upstashCommand<number>(["TTL", key])), 0);
    const blocked = attempts >= MAX_ATTEMPTS_PER_WINDOW;
    const remainingAttempts = Math.max(MAX_ATTEMPTS_PER_WINDOW - attempts, 0);

    return {
      blocked,
      retryAfterSeconds: blocked ? ttl : 0,
      remainingAttempts,
    };
  } catch (error) {
    console.error("Login rate limit status check failed:", error);
    // Re-throw so the login route returns 500 instead of silently allowing
    // unlimited attempts during a Redis outage.
    throw error;
  }
}

export async function recordLoginFailure(
  key: string,
): Promise<LoginRateLimitStatus> {
  if (!hasUpstashConfig()) {
    return {
      blocked: false,
      retryAfterSeconds: 0,
      remainingAttempts: MAX_ATTEMPTS_PER_WINDOW,
    };
  }

  try {
    const attempts = Number(await upstashCommand<number>(["INCR", key]));

    if (attempts === 1) {
      await upstashCommand(["EXPIRE", key, WINDOW_SECONDS]);
    }

    const ttl = Math.max(Number(await upstashCommand<number>(["TTL", key])), 0);
    const remainingAttempts = Math.max(MAX_ATTEMPTS_PER_WINDOW - attempts, 0);

    const blocked = attempts >= MAX_ATTEMPTS_PER_WINDOW;

    return {
      blocked,
      retryAfterSeconds: blocked ? ttl : 0,
      remainingAttempts,
    };
  } catch (error) {
    console.error("Login rate limit record failed (Upstash unavailable):", error);
    // Re-throw so the login route returns 500 instead of silently allowing
    // unlimited attempts during a Redis outage.
    throw error;
  }
}

export async function clearLoginFailures(key: string): Promise<void> {
  if (!hasUpstashConfig()) {
    return;
  }

  try {
    await upstashCommand(["DEL", key]);
  } catch (error) {
    console.error("Unable to clear login rate limit key:", error);
  }
}
