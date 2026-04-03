import "dotenv/config";

import { beforeAll, beforeEach, vi } from "vitest";
import { pool } from "@api/shared/db/db.js";

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
});
