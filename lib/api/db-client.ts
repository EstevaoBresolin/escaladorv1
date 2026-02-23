export type DbFilter = {
  field: string;
  operator?: "eq" | "neq" | "in" | "gte" | "lte" | "ilike";
  value: unknown;
};

export type DbQueryPayload = {
  table: string;
  action: "select" | "insert" | "update" | "delete";
  select?: string;
  single?: boolean;
  filters?: DbFilter[];
  values?: Record<string, unknown>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
};

type DbQueryResponse<T> = {
  data?: T;
  error?: string;
  cached?: boolean;
  ok?: boolean;
};

export async function dbQuery<T = unknown>(
  payload: DbQueryPayload,
): Promise<T> {
  const response = await fetch("/api/db/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as DbQueryResponse<T>;

  if (!response.ok) {
    throw new Error(body.error || "Falha ao executar operacao no backend");
  }

  return body.data as T;
}
