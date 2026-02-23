import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DB_TABLE_POLICIES, IMMUTABLE_FIELDS } from "@/lib/db/policies";
import {
  getUpstashJson,
  hasUpstashConfig,
  setUpstashJson,
  upstashCommand,
} from "@/lib/security/upstash";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const filterSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["eq", "neq", "in", "gte", "lte", "ilike"]).default("eq"),
  value: z.unknown(),
});

const requestSchema = z.object({
  table: z.string().min(1),
  action: z.enum(["select", "insert", "update", "delete"]),
  select: z.string().optional(),
  single: z.boolean().optional(),
  filters: z.array(filterSchema).optional(),
  values: z.record(z.unknown()).optional(),
  orderBy: z.string().optional(),
  ascending: z.boolean().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

function isNullLike(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  );
}

function buildCacheHash(payload: unknown) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("base64url");
}

function applyFilters(
  query: any,
  filters: z.infer<typeof filterSchema>[] = [],
) {
  let next = query;

  for (const filter of filters) {
    switch (filter.operator) {
      case "eq":
        next = next.eq(filter.field, filter.value);
        break;
      case "neq":
        next = next.neq(filter.field, filter.value);
        break;
      case "gte":
        next = next.gte(filter.field, filter.value);
        break;
      case "lte":
        next = next.lte(filter.field, filter.value);
        break;
      case "ilike":
        next = next.ilike(filter.field, filter.value);
        break;
      case "in":
        if (!Array.isArray(filter.value)) {
          throw new Error(`Filtro 'in' invalido para campo ${filter.field}`);
        }
        next = next.in(filter.field, filter.value);
        break;
    }
  }

  return next;
}

function getEqFilterValue(
  filters: z.infer<typeof filterSchema>[] | undefined,
  field: string,
) {
  const filter = (filters || []).find(
    (entry) => entry.operator === "eq" && entry.field === field,
  );
  return filter?.value;
}

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
    const payload = requestSchema.parse(await request.json());
    const policy = DB_TABLE_POLICIES[payload.table];

    if (!policy) {
      return jsonWithCookies(
        { error: "Tabela nao permitida." },
        { status: 403 },
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonWithCookies({ error: "Nao autenticado." }, { status: 401 });
    }

    if (
      (payload.action === "update" || payload.action === "delete") &&
      !payload.filters?.length
    ) {
      return jsonWithCookies(
        { error: "Update/Delete exige ao menos um filtro por seguranca." },
        { status: 400 },
      );
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = currentProfile?.role || "member";
    const isAdmin = userRole === "admin";

    if (payload.table === "profiles") {
      if (payload.action === "delete") {
        return jsonWithCookies(
          { error: "Operacao nao permitida para tabela profiles." },
          { status: 403 },
        );
      }

      const targetProfileId = getEqFilterValue(payload.filters, "id");
      const hasRoleInValues = Boolean(
        payload.values && "role" in payload.values,
      );

      if (hasRoleInValues) {
        console.warn("Blocked profile role update attempt", {
          actorUserId: user.id,
          role: userRole,
          targetProfileId,
        });

        return jsonWithCookies(
          { error: "Alteracao de role nao permitida nesta rota." },
          { status: 403 },
        );
      }

      if (!isAdmin) {
        if (payload.action === "update") {
          if (!targetProfileId || targetProfileId !== user.id) {
            return jsonWithCookies(
              { error: "Somente o proprio perfil pode ser atualizado." },
              { status: 403 },
            );
          }
        }

        if (payload.action === "select") {
          const selectingOwnProfile =
            !targetProfileId || targetProfileId === user.id;

          if (!selectingOwnProfile) {
            return jsonWithCookies(
              { error: "Consulta de profiles restrita para este usuario." },
              { status: 403 },
            );
          }
        }
      }
    }

    let safeValues: Record<string, unknown> = {};

    if (payload.action === "insert" || payload.action === "update") {
      if (!payload.values || typeof payload.values !== "object") {
        return jsonWithCookies(
          { error: "Payload de values invalido." },
          { status: 400 },
        );
      }

      for (const [field, value] of Object.entries(payload.values)) {
        if (IMMUTABLE_FIELDS.has(field)) {
          continue;
        }

        if (!policy.writableFields.includes(field)) {
          continue;
        }

        const mustNotBeNull = policy.nonNullableFields?.includes(field);
        if (mustNotBeNull && isNullLike(value)) {
          return jsonWithCookies(
            { error: `Campo obrigatorio ausente ou nulo: ${field}` },
            { status: 400 },
          );
        }

        if (value !== undefined) {
          safeValues[field] = value;
        }
      }

      if (payload.action === "insert") {
        for (const field of policy.nonNullableFields || []) {
          if (isNullLike(safeValues[field])) {
            return jsonWithCookies(
              { error: `Campo obrigatorio ausente ou nulo: ${field}` },
              { status: 400 },
            );
          }
        }
      }

      if (!Object.keys(safeValues).length && payload.table !== "ministries") {
        return jsonWithCookies(
          { error: "Nenhum campo permitido para alteracao foi enviado." },
          { status: 400 },
        );
      }
    }

    if (payload.table === "ministries" && payload.action === "insert") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.church_id) {
        return jsonWithCookies(
          { error: "Igreja nao encontrada para o usuario." },
          { status: 400 },
        );
      }

      safeValues = {
        ...safeValues,
        church_id: profile.church_id,
      };
    }

    if (payload.action === "select") {
      const selectPayload = {
        table: payload.table,
        action: payload.action,
        select: payload.select || "*",
        filters: payload.filters || [],
        orderBy: payload.orderBy,
        ascending: payload.ascending,
        limit: payload.limit,
        single: payload.single,
      };

      if (hasUpstashConfig()) {
        const versionKey = `db:ver:${payload.table}`;
        const version =
          (await upstashCommand<string | null>(["GET", versionKey])) || "0";
        const hash = buildCacheHash(selectPayload);
        const cacheKey = `db:query:${user.id}:${payload.table}:v${version}:${hash}`;
        const cached = await getUpstashJson<unknown>(cacheKey);

        if (cached !== null) {
          return jsonWithCookies(
            { data: cached, cached: true },
            { status: 200 },
          );
        }

        let query = supabase.from(payload.table).select(payload.select || "*");
        query = applyFilters(query, payload.filters);

        if (payload.orderBy) {
          query = query.order(payload.orderBy, {
            ascending: payload.ascending ?? true,
          });
        }

        if (payload.limit) {
          query = query.limit(payload.limit);
        }

        const { data, error } = payload.single
          ? await query.single()
          : await query;

        if (error) {
          return jsonWithCookies({ error: error.message }, { status: 400 });
        }

        await setUpstashJson(cacheKey, data, policy.cacheTtlSeconds);
        return jsonWithCookies({ data, cached: false }, { status: 200 });
      }

      let query = supabase.from(payload.table).select(payload.select || "*");
      query = applyFilters(query, payload.filters);

      if (payload.orderBy) {
        query = query.order(payload.orderBy, {
          ascending: payload.ascending ?? true,
        });
      }

      if (payload.limit) {
        query = query.limit(payload.limit);
      }

      const { data, error } = payload.single
        ? await query.single()
        : await query;

      if (error) {
        return jsonWithCookies({ error: error.message }, { status: 400 });
      }

      return jsonWithCookies({ data, cached: false }, { status: 200 });
    }

    if (payload.action === "insert") {
      let query: any = supabase.from(payload.table).insert(safeValues);
      if (payload.select) {
        query = query.select(payload.select);
      }
      const { data, error } = payload.single
        ? await query.single()
        : await query;

      if (error) {
        return jsonWithCookies({ error: error.message }, { status: 400 });
      }

      for (const tableToInvalidate of [
        payload.table,
        ...(policy.invalidateTables || []),
      ]) {
        if (hasUpstashConfig()) {
          await upstashCommand(["INCR", `db:ver:${tableToInvalidate}`]);
        }
      }

      return jsonWithCookies({ data }, { status: 200 });
    }

    if (payload.action === "update") {
      let query: any = supabase.from(payload.table).update(safeValues);
      query = applyFilters(query, payload.filters);

      if (payload.select) {
        query = query.select(payload.select);
      }

      const { data, error } = await query;

      if (error) {
        return jsonWithCookies({ error: error.message }, { status: 400 });
      }

      for (const tableToInvalidate of [
        payload.table,
        ...(policy.invalidateTables || []),
      ]) {
        if (hasUpstashConfig()) {
          await upstashCommand(["INCR", `db:ver:${tableToInvalidate}`]);
        }
      }

      return jsonWithCookies({ data }, { status: 200 });
    }

    let query = supabase.from(payload.table).delete();
    query = applyFilters(query, payload.filters);
    const { error } = await query;

    if (error) {
      return jsonWithCookies({ error: error.message }, { status: 400 });
    }

    for (const tableToInvalidate of [
      payload.table,
      ...(policy.invalidateTables || []),
    ]) {
      if (hasUpstashConfig()) {
        await upstashCommand(["INCR", `db:ver:${tableToInvalidate}`]);
      }
    }

    return jsonWithCookies({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("DB query API error:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar query." },
      { status: 500 },
    );
  }
}
