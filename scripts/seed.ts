import "dotenv/config";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/passwords";
import { getDb } from "../lib/db";
import { preferences, users } from "../lib/db/schema";

/**
 * Seeds the demo evaluator account (idempotent — safe to run repeatedly).
 * Run with: npm run db:seed
 */

const DEMO_EMAIL = "demo@virasat.app";
const DEMO_NAME = "Demo Evaluator";
const DEMO_PASSWORD = "VirasatDemo@2026";

async function seed(): Promise<void> {
  const db = getDb();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);

  if (existing) {
    console.log(`Demo account ${DEMO_EMAIL} already exists (id: ${existing.id}). Nothing to do.`);
    return;
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [user] = await db
    .insert(users)
    .values({ email: DEMO_EMAIL, name: DEMO_NAME, passwordHash })
    .returning({ id: users.id });

  await db.insert(preferences).values({
    userId: user.id,
    interests: ["Heritage & Monuments", "Food & Cuisine"],
    homeRegion: "Rajasthan",
    travelStyle: "Immersive slow travel",
  });

  console.log(`Created demo account ${DEMO_EMAIL} (id: ${user.id}) with starter preferences.`);
  console.log(`Sign in with password: ${DEMO_PASSWORD}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
