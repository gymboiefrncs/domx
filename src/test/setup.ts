import "dotenv/config";

import { beforeAll, beforeEach, vi } from "vitest";
import { resetDB } from "../config/db.js";

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(async () => {
  await resetDB();
});
