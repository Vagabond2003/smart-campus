import { defineConfig } from "vitest/config";

// Unit tests: pure logic in src/, no browser and no Firebase. Rules and browser tests have their
// own runners (vitest.rules.config.ts, playwright.config.ts) because they need the emulators.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    env: { TZ: "Asia/Dhaka" },
  },
});
