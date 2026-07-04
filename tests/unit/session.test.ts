import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  type SessionUser,
} from "@/lib/auth/session";

const user: SessionUser = {
  id: "11111111-2222-3333-4444-555555555555",
  email: "asha@example.com",
  name: "Asha Rao",
};

describe("session tokens", () => {
  it("round-trips id, email, and name through create + verify", async () => {
    const token = await createSessionToken(user);
    const verified = await verifySessionToken(token);
    expect(verified).toEqual(user);
  });

  it("returns null for a token whose payload was tampered with", async () => {
    const token = await createSessionToken(user);
    const [header, payload, signature] = token.split(".");
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    claims.name = "Mallory";
    const tamperedPayload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    const tampered = [header, tamperedPayload, signature].join(".");

    expect(tampered).not.toBe(token);
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    const original = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = "a-completely-different-secret-0123456789abcdefgh";
    let foreignToken: string;
    try {
      foreignToken = await createSessionToken(user);
    } finally {
      process.env.AUTH_SECRET = original;
    }
    expect(await verifySessionToken(foreignToken)).toBeNull();
  });

  it("returns null for a garbage string", async () => {
    expect(await verifySessionToken("not-a-jwt-at-all")).toBeNull();
    expect(await verifySessionToken("a.b.c")).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
  });
});
