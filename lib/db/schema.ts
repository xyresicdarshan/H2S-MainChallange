import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Drizzle ORM schema (PostgreSQL). Apply with `npm run db:push`.
 * All user content is scoped by user_id with cascading deletes so removing a
 * user removes every trace of their data.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preferences = pgTable("preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  interests: jsonb("interests")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  homeRegion: text("home_region"),
  travelStyle: text("travel_style"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedItems = pgTable(
  "saved_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(), // 'attraction' | 'hidden-gem' | 'event' | 'story'
    title: text("title").notNull(),
    region: text("region"),
    summary: text("summary"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Covers the only read path: "this user's items, newest first" — avoids a
  // full-table scan + sort as the table grows.
  (t) => [index("saved_items_user_created_idx").on(t.userId, t.createdAt)],
);

/**
 * Audit log of every real Gemini call made on behalf of a user: which feature,
 * which model, how long it took. Doubles as proof that outputs are live API
 * results rather than canned content.
 */
export const aiInteractions = pgTable(
  "ai_interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(), // 'recommendations' | 'hidden-gems' | 'events' | 'story'
    model: text("model").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    request: jsonb("request").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Audit queries are always per-user and time-ordered.
  (t) => [index("ai_interactions_user_created_idx").on(t.userId, t.createdAt)],
);
