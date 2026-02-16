import "dotenv/config";

import { beforeEach } from "vitest";
import { resetDB } from "../config/db.js";

// beforeAll(async () => {
//   await connectDB();
// });

beforeEach(async () => {
  await resetDB();
});

// afterAll(async () => {
//   await disconnectDB();
// });
