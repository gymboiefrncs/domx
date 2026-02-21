import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
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
          ],
        },
      },
    ],
  },
});
