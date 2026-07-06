import { defineConfig } from "vitest/config";

// Unit tests run headlessly under Node — the pure scoring/collision modules have
// no browser, DOM or three.js dependency, so no jsdom environment is needed.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
