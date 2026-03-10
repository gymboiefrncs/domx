// ─── Shared Types ───────────────────────────────────────────────
export type Result =
  | { ok: true; message: string; data?: unknown }
  | { ok: false; message: string };

export type Role = "user" | "moderator" | "admin";

// ─── Shared Constants ───────────────────────────────────────────
export const APP_NAME = "DomX";

// HTTP status descriptions shared across client/server
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ─── API Route Constants ────────────────────────────────────────
export const API_BASE = "/api/v1";
