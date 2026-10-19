import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // The engine is shared logic for several club sites: it must never pull in
    // a site's UI, styles or copy. Only the venue/content config is allowed.
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/ui", "@/ui/*", "@/app", "@/app/*"], message: "engine must not import site UI; expose data/actions and let the UI render them." },
            { group: ["@/config/site", "@/config/home", "*.css"], message: "engine must not depend on site branding, copy or styles." },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
