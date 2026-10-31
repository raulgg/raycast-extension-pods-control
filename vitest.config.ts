import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    setupFiles: ["./tests/console.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/**/*.test.{ts,tsx}"],
          exclude: ["tests/integration/**"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.{ts,tsx}"],
          environment: "node",
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["extension/src/**/*.{ts,tsx}"],
      exclude: ["**/node_modules/**", "**/*.d.ts"],
    },
  },
  resolve: {
    // react-dom installs at the root, so production code must share the root copy of React.
    dedupe: ["react"],
    alias: {
      "@": resolve(import.meta.dirname, "./extension/src"),
      "@raycast/api": resolve(import.meta.dirname, "./tests/mocks/raycast-api-mock.ts"),
      "@raycast/utils": resolve(import.meta.dirname, "./tests/mocks/raycast-utils-mock.ts"),
    },
  },
});
