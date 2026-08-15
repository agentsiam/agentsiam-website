import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Design reference, not source. The .dc.html prototypes and their runtime are read as
    // documentation and recreated in src/; linting someone else's prototype runtime only
    // produces noise that hides real findings.
    "design_handoff_agentsiam_portal/**",
  ]),
]);

export default eslintConfig;
