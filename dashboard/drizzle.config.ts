import { mkdirSync } from "node:fs"
import { defineConfig } from "drizzle-kit"

mkdirSync("./data", { recursive: true })

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: "./data/app.db" },
})
