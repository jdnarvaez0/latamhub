/**
 * Vitest configuration for the testing foundation slice.
 *
 * - Uses the canonical `defineConfig` from `vitest/config` (full
 *   TypeScript inference for the `test` block).
 * - Runs in the `node` environment: pure modules (URL parsing, filtering
 *   predicates, pagination, option helpers) do not need `jsdom` /
 *   `happy-dom` and pulling one in would slow CI without value.
 * - Includes colocated test files only — `.test.ts` / `.test.tsx` next to
 *   the source they exercise. `__tests__/` directories, ad-hoc specs
 *   and `.spec.ts` files are intentionally excluded so the convention
 *   stays narrow and reviewers always know where tests live.
 * - Resolves the `@/*` alias via `tsconfig.json` so the tests use the
 *   same imports the production code uses (`@/lib/...`, `@/components/...`).
 */
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const r = (relativePath: string) => resolve(import.meta.dirname, relativePath);

export default defineConfig({
  resolve: {
    alias: {
      "@": r("./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
