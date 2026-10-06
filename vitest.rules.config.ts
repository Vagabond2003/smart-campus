import { defineConfig } from "vitest/config";

// Security-rules tests. They need the Firestore emulator, so run them through `npm run test:rules`,
// which starts it, runs this suite and stops it again.
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    environment: "node",
    testTimeout: 20_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
