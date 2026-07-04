import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { setSessionCookie } from "@/lib/auth/session";

// Chainable stub mirroring exactly how the routes query:
//   select(...).from(...).where(...).limit(1)  -> dbState.selectResult
//   insert(...).values(...).returning(...)     -> dbState.insertResult
const dbState = vi.hoisted(() => ({
  selectResult: [] as Array<Record<string, unknown>>,
  insertResult: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => dbState.selectResult,
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: async () => dbState.insertResult,
      }),
    }),
  }),
}));

// Cookie writes need a Next request scope; stub them and assert the calls.
vi.mock("@/lib/auth/session", () => ({
  setSessionCookie: vi.fn(async () => undefined),
}));

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  dbState.selectResult = [];
  dbState.insertResult = [];
});

describe("POST /api/auth/register", () => {
  it("returns 400 for an invalid body", async () => {
    const res = await registerPost(
      jsonRequest("http://test/api/auth/register", {
        name: "A",
        email: "not-an-email",
        password: "short",
      }),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(typeof body.error).toBe("string");
    expect(vi.mocked(setSessionCookie)).not.toHaveBeenCalled();
  });

  it("returns 409 EMAIL_TAKEN for a duplicate email", async () => {
    dbState.selectResult = [{ id: "existing-user-id" }];

    const res = await registerPost(
      jsonRequest("http://test/api/auth/register", {
        name: "Asha Rao",
        email: "asha@example.com",
        password: "sunrise42",
      }),
    );
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string; code?: string };
    expect(body.code).toBe("EMAIL_TAKEN");
    expect(vi.mocked(setSessionCookie)).not.toHaveBeenCalled();
  });

  it(
    "returns 200 with the user and sets the session cookie on success",
    async () => {
      const created = { id: "new-user-id", email: "asha@example.com", name: "Asha Rao" };
      dbState.selectResult = [];
      dbState.insertResult = [created];

      const res = await registerPost(
        jsonRequest("http://test/api/auth/register", {
          name: "Asha Rao",
          email: "Asha@Example.com",
          password: "sunrise42",
        }),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { user: typeof created };
      expect(body.user).toEqual(created);
      expect(vi.mocked(setSessionCookie)).toHaveBeenCalledWith(created);
    },
    30_000, // real cost-12 bcrypt hash runs inside the route
  );
});

describe("POST /api/auth/login", () => {
  const storedUser = {
    id: "user-1",
    email: "asha@example.com",
    name: "Asha Rao",
    passwordHash: "",
  };

  it("returns 401 BAD_CREDENTIALS for an unknown email", async () => {
    dbState.selectResult = [];

    const res = await loginPost(
      jsonRequest("http://test/api/auth/login", {
        email: "nobody@example.com",
        password: "whatever1",
      }),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string; code?: string };
    expect(body.error).toBe("Invalid email or password.");
    expect(body.code).toBe("BAD_CREDENTIALS");
    expect(vi.mocked(setSessionCookie)).not.toHaveBeenCalled();
  });

  it("returns 401 BAD_CREDENTIALS for a wrong password", async () => {
    // Real bcrypt hash of a DIFFERENT password (low cost keeps the test fast).
    dbState.selectResult = [
      { ...storedUser, passwordHash: await bcrypt.hash("some-other-password-9", 4) },
    ];

    const res = await loginPost(
      jsonRequest("http://test/api/auth/login", {
        email: "asha@example.com",
        password: "not-the-password-1",
      }),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string; code?: string };
    expect(body.code).toBe("BAD_CREDENTIALS");
    expect(vi.mocked(setSessionCookie)).not.toHaveBeenCalled();
  });

  it("returns 200 with the user and sets the session cookie for correct credentials", async () => {
    dbState.selectResult = [
      { ...storedUser, passwordHash: await bcrypt.hash("right-password-7", 4) },
    ];

    const res = await loginPost(
      jsonRequest("http://test/api/auth/login", {
        email: "Asha@Example.com", // login schema lowercases before lookup
        password: "right-password-7",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string; email: string; name: string } };
    expect(body.user).toEqual({ id: "user-1", email: "asha@example.com", name: "Asha Rao" });
    expect(vi.mocked(setSessionCookie)).toHaveBeenCalledWith(body.user);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await loginPost(
      jsonRequest("http://test/api/auth/login", {
        email: "asha@example.com",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty password", async () => {
    const res = await loginPost(
      jsonRequest("http://test/api/auth/login", {
        email: "asha@example.com",
        password: "",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/register - Additional Edge Cases", () => {
  it("returns 400 for missing name field", async () => {
    const res = await registerPost(
      jsonRequest("http://test/api/auth/register", {
        email: "asha@example.com",
        password: "sunrise42",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for password without number", async () => {
    const res = await registerPost(
      jsonRequest("http://test/api/auth/register", {
        name: "Asha Rao",
        email: "asha@example.com",
        password: "OnlyLetters",
      }),
    );
    expect(res.status).toBe(400);
  });
});
