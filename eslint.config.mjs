import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import smartQuotes from "./eslint-rules/smart-quotes.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // code-standards.md: hardcoded UI copy should use curly quotes/apostrophes
  // directly -- nothing else in the toolchain enforced this until now.
  {
    plugins: { local: { rules: { "smart-quotes": smartQuotes } } },
    rules: { "local/smart-quotes": "error" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
