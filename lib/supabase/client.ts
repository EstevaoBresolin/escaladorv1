import { createBrowserClient } from "@supabase/ssr";

type FilterOperator = "eq" | "neq" | "in" | "gte" | "lte" | "ilike";

type DbOperation = {
  table: string;
  action: "select" | "insert" | "update" | "delete";
  select?: string;
  single?: boolean;
  filters?: Array<{ field: string; operator: FilterOperator; value: unknown }>;
  values?: Record<string, unknown>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
};

type DbExecuteResult = {
  data: unknown;
  error: { message: string } | null;
};

const pendingSelectRequests = new Map<string, Promise<DbExecuteResult>>();
let pendingGetUserRequest: Promise<
  Awaited<ReturnType<ReturnType<typeof createBrowserClient>["auth"]["getUser"]>>
> | null = null;

function buildSelectRequestKey(operation: DbOperation) {
  const normalizedFilters = (operation.filters || [])
    .map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    }))
    .sort((a, b) => {
      if (a.field === b.field) {
        return a.operator.localeCompare(b.operator);
      }
      return a.field.localeCompare(b.field);
    });

  return JSON.stringify({
    table: operation.table,
    action: operation.action,
    select: operation.select || "*",
    single: Boolean(operation.single),
    filters: normalizedFilters,
    orderBy: operation.orderBy || null,
    ascending: operation.ascending ?? true,
    limit: operation.limit || null,
  });
}

class BackendDbQueryBuilder {
  private operation: DbOperation;

  constructor(table: string) {
    this.operation = {
      table,
      action: "select",
      filters: [],
      select: "*",
    };
  }

  select(columns = "*") {
    this.operation.select = columns;
    return this;
  }

  insert(values: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation.action = "insert";
    this.operation.values = Array.isArray(values) ? values[0] : values;
    return this;
  }

  update(values: Record<string, unknown>) {
    this.operation.action = "update";
    this.operation.values = values;
    return this;
  }

  delete() {
    this.operation.action = "delete";
    return this;
  }

  eq(field: string, value: unknown) {
    this.operation.filters?.push({ field, operator: "eq", value });
    return this;
  }

  neq(field: string, value: unknown) {
    this.operation.filters?.push({ field, operator: "neq", value });
    return this;
  }

  in(field: string, value: unknown[]) {
    this.operation.filters?.push({ field, operator: "in", value });
    return this;
  }

  gte(field: string, value: unknown) {
    this.operation.filters?.push({ field, operator: "gte", value });
    return this;
  }

  lte(field: string, value: unknown) {
    this.operation.filters?.push({ field, operator: "lte", value });
    return this;
  }

  ilike(field: string, value: unknown) {
    this.operation.filters?.push({ field, operator: "ilike", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.operation.orderBy = column;
    this.operation.ascending = options?.ascending ?? true;
    return this;
  }

  limit(limit: number) {
    this.operation.limit = limit;
    return this;
  }

  single() {
    this.operation.single = true;
    return this.execute();
  }

  async execute() {
    if (this.operation.action === "select") {
      const requestKey = buildSelectRequestKey(this.operation);
      const pending = pendingSelectRequests.get(requestKey);

      if (pending) {
        return pending;
      }

      const nextRequest = this.runRequest();
      pendingSelectRequests.set(requestKey, nextRequest);

      nextRequest.finally(() => {
        pendingSelectRequests.delete(requestKey);
      });

      return nextRequest;
    }

    return this.runRequest();
  }

  private async runRequest(): Promise<DbExecuteResult> {
    try {
      const response = await fetch("/api/db/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.operation),
      });

      const body = (await response.json()) as {
        data?: unknown;
        error?: string;
      };

      if (!response.ok) {
        return {
          data: null,
          error: { message: body.error || "Erro ao executar operação" },
        };
      }

      return {
        data: body.data ?? null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message:
            error instanceof Error ? error.message : "Erro de rede na API DB",
        },
      };
    }
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: unknown;
          error: { message: string } | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ) {
    return this.execute().catch(onrejected as any);
  }

  finally(onfinally?: (() => void) | null) {
    return this.execute().finally(onfinally as any);
  }
}

export function createClient() {
  const browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const originalGetUser = browserClient.auth.getUser.bind(browserClient.auth);
  browserClient.auth.getUser = (async (...args: Parameters<typeof originalGetUser>) => {
    if (pendingGetUserRequest) {
      return pendingGetUserRequest;
    }

    pendingGetUserRequest = originalGetUser(...args).finally(() => {
      pendingGetUserRequest = null;
    });

    return pendingGetUserRequest;
  }) as typeof browserClient.auth.getUser;

  return new Proxy(browserClient as any, {
    get(target, prop, receiver) {
      if (prop === "from") {
        return (table: string) => new BackendDbQueryBuilder(table);
      }

      return Reflect.get(target, prop, receiver);
    },
  }) as typeof browserClient;
}
