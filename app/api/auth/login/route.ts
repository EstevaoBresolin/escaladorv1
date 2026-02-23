import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  buildRequestFingerprint,
  buildLoginKey,
  clearLoginFailures,
  getClientIp,
  getLoginFailureStatus,
  recordLoginFailure,
} from "@/lib/security/login-rate-limit";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function POST(request: NextRequest) {
  const cookiesToSet: CookieToSet[] = [];

  const jsonWithCookies = (
    body: Record<string, unknown>,
    init?: ResponseInit,
  ) => {
    const response = NextResponse.json(body, init);
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  };

  try {
    const { email, password } = await request.json();

    if (typeof email !== "string" || typeof password !== "string") {
      return jsonWithCookies(
        { error: "Email e senha sao obrigatorios." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return jsonWithCookies(
        { error: "Email e senha sao obrigatorios." },
        { status: 400 },
      );
    }

    const ip = getClientIp(request.headers);
    const fingerprint = buildRequestFingerprint(request.headers);
    const rateLimitKey = buildLoginKey(ip, normalizedEmail, fingerprint);

    const preCheckStatus = await getLoginFailureStatus(rateLimitKey);
    if (preCheckStatus.blocked) {
      console.warn("Blocked login attempt by rate-limit pre-check", {
        email: normalizedEmail,
        ip,
      });

      return jsonWithCookies(
        {
          error:
            "Muitas tentativas de login. Aguarde antes de tentar novamente.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(preCheckStatus.retryAfterSeconds) },
        },
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(nextCookies) {
            nextCookies.forEach(({ name, value, options }) => {
              cookiesToSet.push({ name, value, options });
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const status = await recordLoginFailure(rateLimitKey);

      if (status.blocked) {
        console.warn("Blocked login attempt by rate-limit post-check", {
          email: normalizedEmail,
          ip,
        });

        return jsonWithCookies(
          {
            error:
              "Muitas tentativas de login. Aguarde antes de tentar novamente.",
          },
          {
            status: 429,
            headers: { "Retry-After": String(status.retryAfterSeconds) },
          },
        );
      }

      return jsonWithCookies(
        {
          error: "Email ou senha incorretos.",
          remainingAttempts: status.remainingAttempts,
        },
        { status: 401 },
      );
    }

    await clearLoginFailures(rateLimitKey);

    return jsonWithCookies({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Login API error:", error);
    return jsonWithCookies(
      { error: "Erro interno no login." },
      { status: 500 },
    );
  }
}
