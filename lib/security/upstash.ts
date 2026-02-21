const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function hasUpstashConfig() {
  return Boolean(UPSTASH_URL && UPSTASH_TOKEN);
}

export async function upstashCommand<T = unknown>(
  command: unknown[],
): Promise<T> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error("Upstash Redis is not configured");
  }

  const headers = {
    Authorization: `Bearer ${UPSTASH_TOKEN}`,
    "Content-Type": "application/json",
  };

  let response = await fetch(UPSTASH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) {
    response = await fetch(UPSTASH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ command }),
      cache: "no-store",
    });
  }

  if (!response.ok) {
    throw new Error(`Upstash command failed with status ${response.status}`);
  }

  const data = (await response.json()) as
    | { result?: T; error?: string }
    | { error?: string }
    | T;

  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    data.error
  ) {
    throw new Error(data.error);
  }

  if (typeof data === "object" && data !== null && "result" in data) {
    return data.result as T;
  }

  return data as T;
}

export async function getUpstashJson<T>(key: string): Promise<T | null> {
  if (!hasUpstashConfig()) {
    return null;
  }

  try {
    const value = await upstashCommand<string | null>(["GET", key]);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Upstash GET JSON error:", error);
    return null;
  }
}

export async function setUpstashJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (!hasUpstashConfig()) {
    return;
  }

  try {
    await upstashCommand(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);
  } catch (error) {
    console.error("Upstash SET JSON error:", error);
  }
}
