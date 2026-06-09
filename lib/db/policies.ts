export type TablePolicy = {
  writableFields: string[];
  nonNullableFields?: string[];
  filterableFields: string[];
  cacheTtlSeconds: number;
  invalidateTables?: string[];
};

export const IMMUTABLE_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "criado_em",
  "atualizado_em",
]);

export const DB_TABLE_POLICIES: Record<string, TablePolicy> = {
  profiles: {
    writableFields: [
      "name",
      "email",
      "phone",
      "birth_date",
      "church_id",
      "is_profile_complete",
    ],
    nonNullableFields: ["name"],
    filterableFields: ["id", "name", "email", "church_id", "role"],
    cacheTtlSeconds: 60,
    invalidateTables: [
      "user_ministries",
      "ministry_leaders",
      "volunteer_slots",
    ],
  },
  churches: {
    writableFields: ["name", "cnpj", "address", "logo_url"],
    nonNullableFields: ["name"],
    filterableFields: ["id", "name", "cnpj"],
    cacheTtlSeconds: 300,
  },
  ministries: {
    writableFields: ["name", "description", "color"],
    nonNullableFields: ["name", "color"],
    filterableFields: ["id", "church_id", "name", "color"],
    cacheTtlSeconds: 60,
    invalidateTables: [
      "user_ministries",
      "ministry_leaders",
      "ministry_functions",
    ],
  },
  events: {
    writableFields: [
      "church_id",
      "title",
      "description",
      "location",
      "date",
      "start_time",
      "end_time",
    ],
    nonNullableFields: [
      "church_id",
      "title",
      "date",
      "start_time",
      "description",
    ],
    filterableFields: ["id", "church_id", "date"],
    cacheTtlSeconds: 60,
    invalidateTables: ["event_ministries", "volunteer_slots"],
  },
  event_ministries: {
    writableFields: ["event_id", "ministry_id"],
    nonNullableFields: ["event_id", "ministry_id"],
    filterableFields: ["id", "event_id", "ministry_id"],
    cacheTtlSeconds: 60,
    invalidateTables: ["events", "ministries"],
  },
  notifications: {
    writableFields: ["is_read"],
    nonNullableFields: ["is_read"],
    filterableFields: ["id", "user_id", "is_read"],
    cacheTtlSeconds: 30,
  },
  ministry_functions: {
    writableFields: ["ministry_id", "name"],
    nonNullableFields: ["ministry_id", "name"],
    filterableFields: ["id", "ministry_id", "name"],
    cacheTtlSeconds: 60,
  },
  ministry_leaders: {
    writableFields: ["ministry_id", "user_id"],
    nonNullableFields: ["ministry_id", "user_id"],
    filterableFields: ["id", "ministry_id", "user_id"],
    cacheTtlSeconds: 60,
  },
  user_ministries: {
    writableFields: ["ministry_id", "user_id"],
    nonNullableFields: ["ministry_id", "user_id"],
    filterableFields: ["id", "ministry_id", "user_id"],
    cacheTtlSeconds: 60,
  },
  volunteer_slots: {
    writableFields: [
      "event_id",
      "ministry_id",
      "user_id",
      "function_id",
      "status",
      "notes",
    ],
    nonNullableFields: ["event_id", "ministry_id", "user_id"],
    filterableFields: [
      "id",
      "event_id",
      "ministry_id",
      "user_id",
      "function_id",
    ],
    cacheTtlSeconds: 30,
    invalidateTables: ["events"],
  },
  volunteer_unavailability: {
    writableFields: ["user_id", "unavailable_date", "period", "reason"],
    nonNullableFields: ["user_id", "unavailable_date"],
    filterableFields: ["id", "user_id", "unavailable_date", "period"],
    cacheTtlSeconds: 30,
  },
};
