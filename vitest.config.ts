import path from "node:path";
import { defineConfig } from "vitest/config";

export const vitestConfig = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: true,
    fileParallelism: false,
  },
});

export default vitestConfig;
