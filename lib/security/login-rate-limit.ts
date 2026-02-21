const WINDOW_SECONDS = 10 * 60 // 10 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

export type LoginRateLimitStatus = {
  blocked: boolean
  retryAfterSeconds: number
  remainingAttempts: number
}

function hasUpstashConfig() {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN)
}

async function upstashCommand<T = unknown>(command: unknown[]): Promise<T> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error("Upstash Redis is not configured")
  }

  const baseUrl = UPSTASH_URL.endsWith("/") ? UPSTASH_URL.slice(0, -1) : UPSTASH_URL

  const headers = {
    Authorization: `Bearer ${UPSTASH_TOKEN}`,
    "Content-Type": "application/json",
  }

  const response = await fetch(`${baseUrl}/pipeline`, {
    method: "POST",
    headers,
    body: JSON.stringify([command]),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Upstash command failed with status ${response.status}`)
  }

  const data = (await response.json()) as Array<{ result?: T; error?: string }>
  const first = data?.[0]

  if (!first) {
    throw new Error("Upstash pipeline returned an empty response")
  }

  if (first.error) {
    throw new Error(first.error)
  }

  return first.result as T
}

export function buildLoginKey(ip: string, email: string): string {
  return `rl:login:${ip.toLowerCase()}::${email.trim().toLowerCase()}`
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  return "unknown"
}

export async function recordLoginFailure(key: string): Promise<LoginRateLimitStatus> {
  if (!hasUpstashConfig()) {
    return {
      blocked: false,
      retryAfterSeconds: 0,
      remainingAttempts: MAX_ATTEMPTS_PER_WINDOW,
    }
  }

  try {
    const attempts = Number(await upstashCommand<number>(["INCR", key]))

    if (attempts === 1) {
      await upstashCommand(["EXPIRE", key, WINDOW_SECONDS])
    }

    const ttl = Math.max(Number(await upstashCommand<number>(["TTL", key])), 0)
    const remainingAttempts = Math.max(MAX_ATTEMPTS_PER_WINDOW - attempts, 0)

    return {
      blocked: attempts > MAX_ATTEMPTS_PER_WINDOW,
      retryAfterSeconds: attempts > MAX_ATTEMPTS_PER_WINDOW ? ttl : 0,
      remainingAttempts,
    }
  } catch (error) {
    console.error("Login rate limit fallback (Upstash unavailable):", error)

    // Fallback to fail-open in case Redis is temporarily unavailable.
    return {
      blocked: false,
      retryAfterSeconds: 0,
      remainingAttempts: MAX_ATTEMPTS_PER_WINDOW,
    }
  }
}

export async function clearLoginFailures(key: string): Promise<void> {
  if (!hasUpstashConfig()) {
    return
  }

  try {
    await upstashCommand(["DEL", key])
  } catch (error) {
    console.error("Unable to clear login rate limit key:", error)
  }
}
