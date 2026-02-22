import "dotenv/config";

import { beforeAll, beforeEach, vi } from "vitest";
import { resetDB } from "../config/db.js";

// src/test/setup.ts
beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// beforeAll(async () => {
//   await connectDB();
// });

beforeEach(async () => {
  await resetDB();
});

// afterAll(async () => {
//   await disconnectDB();
// });
