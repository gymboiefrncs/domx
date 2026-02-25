import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // isolate: true,
    globals: true,
    environment: "node",
    setupFiles: "./src/test/setup.ts",
    projects: [
      {
        extends: true,
        test: {
          name: "auth-suite",
          include: [
            "src/test/auth/auth-service.test.ts",
            "src/test/auth/auth.api.test.ts",
            "src/test/verification/verification-service.test.ts",
          ],
        },
      },
    ],
  },
});
