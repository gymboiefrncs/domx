import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
    fileParallelism: false,
    globals: true,
    environment: "node",
    setupFiles: "./test/setup.ts",
    projects: [
      {
        extends: true,
        test: {
          name: "auth-suite",
          include: [
            "./test/auth/auth-service.test.ts",
            "./test/auth/auth.api.test.ts",
            "./test/verification/verification-service.test.ts",
            "./test/groups/group.api.test.ts",
            "./test/posts/post.api.test.ts",
          ],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@api": path.resolve(__dirname, "src"),
    },
  },
});
