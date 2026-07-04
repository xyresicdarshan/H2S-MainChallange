import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazily-initialized database client.
 *
 * Why lazy: `next build` imports route modules to analyze them; a top-level
 * connection would make the build require DATABASE_URL. Deferring to first
 * use keeps builds env-free and gives serverless functions one connection
 * per instance.
 *
 * `prepare: false` — required for transaction-pooling proxies (Neon/Supabase
 * pooled connection strings) which don't support named prepared statements.
 */

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

let _db: DbClient | null = null;

export function getDb(): DbClient {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add a Postgres connection string.",
    );
  }
  const client = postgres(url, {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 1 : 5,
  });
  _db = drizzle(client, { schema });
  return _db;
}

export type Db = DbClient;
export { schema };
