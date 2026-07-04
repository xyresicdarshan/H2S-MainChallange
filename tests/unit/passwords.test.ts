import { beforeAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";

const PLAIN = "correct-horse-battery-1";

describe("password hashing", () => {
  let hash: string;

  // Cost-12 bcrypt is deliberately slow; hash once and give it generous time.
  beforeAll(async () => {
    hash = await hashPassword(PLAIN);
  }, 30_000);

  it("verifies the original password against its hash", async () => {
    await expect(verifyPassword(PLAIN, hash)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    await expect(verifyPassword("wrong-password-2", hash)).resolves.toBe(false);
  });

  it("does not store the plain text and looks like a bcrypt hash", () => {
    expect(hash).not.toBe(PLAIN);
    expect(hash).not.toContain(PLAIN);
    // bcrypt format: $2a/$2b/$2y, two-digit cost, 22-char salt + 31-char digest.
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
  });
});
