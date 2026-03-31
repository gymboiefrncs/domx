export type Result<T = unknown> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string };

export type CustomErrorContent = {
  message: string;
  context?: Record<string, unknown>;
};
