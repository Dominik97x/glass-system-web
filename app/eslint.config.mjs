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

    // Local pre-deploy and diagnostic files.
    ".review/**",
  ]),

  // These are manual Bitrix24 administrative/audit utilities.
  // They are not part of the Next.js production runtime.
  {
    files: [
      "scripts/bitrix24-acceptance-protocol-setup.ts",
      "scripts/bitrix24-document-stage-readiness-audit.ts",
      "scripts/bitrix24-material-process-audit.ts",
      "scripts/bitrix24-sales-card-layout-fix.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
