import { defineConfig } from "turso";

export default defineConfig({
  db: {
    url: process.env.TURSO_DATABASE_URL || "file:./data/lifevault.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});