import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { migrate } from "drizzle-orm/libsql/migrator"

import * as schema from "./schema"

let db: ReturnType<typeof drizzle<typeof schema>> | null = null

// Lazy connect so `next build` never needs a live DB.
// First call opens the file and runs pending migrations.
export async function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL ?? "file:./data/app.db"
    const client = createClient({ url })
    db = drizzle(client, { schema })
    await migrate(db, { migrationsFolder: "./drizzle" })
  }
  return db
}
