const WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5
const BASE_LOCKOUT_MS = 60 * 1000 // 1 minute
const MAX_LOCKOUT_MS = 30 * 60 * 1000 // 30 minutes

type LoginBucket = {
  attempts: number
  firstAttemptAt: number
  blockedUntil: number
}

const buckets = new Map<string, LoginBucket>()

function cleanupBucket(now: number, key: string, bucket: LoginBucket) {
  if (bucket.blockedUntil <= now && now - bucket.firstAttemptAt > WINDOW_MS) {
    buckets.delete(key)
  }
}

export function buildLoginKey(ip: string, email: string): string {
  return `${ip.toLowerCase()}::${email.trim().toLowerCase()}`
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

export function getLoginRateLimitStatus(key: string) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket) {
    return { blocked: false, retryAfterSeconds: 0, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW }
  }

  cleanupBucket(now, key, bucket)

  if (bucket.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
      remainingAttempts: 0,
    }
  }

  if (now - bucket.firstAttemptAt > WINDOW_MS) {
    buckets.delete(key)
    return { blocked: false, retryAfterSeconds: 0, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW }
  }

  return {
    blocked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(MAX_ATTEMPTS_PER_WINDOW - bucket.attempts, 0),
  }
}

export function recordLoginFailure(key: string) {
  const now = Date.now()
  const previous = buckets.get(key)

  if (!previous || now - previous.firstAttemptAt > WINDOW_MS) {
    buckets.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    })
    return getLoginRateLimitStatus(key)
  }

  previous.attempts += 1

  if (previous.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
    const extraAttempts = previous.attempts - MAX_ATTEMPTS_PER_WINDOW
    const lockoutMs = Math.min(BASE_LOCKOUT_MS * 2 ** extraAttempts, MAX_LOCKOUT_MS)
    previous.blockedUntil = now + lockoutMs
  }

  buckets.set(key, previous)
  return getLoginRateLimitStatus(key)
}

export function clearLoginFailures(key: string) {
  buckets.delete(key)
}
