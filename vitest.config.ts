/** Unit tests for engine logic (src/**\/*.test.ts): npm test */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    env: { NEXT_PUBLIC_PAYMENT_HOSTS: "sep.shaparak.ir,pec.shaparak.ir", NEXT_PUBLIC_API_URL: "" },
  },
});
