import "@testing-library/jest-dom/vitest";

// 48-char secret: session helpers require AUTH_SECRET >= 32 chars at call time.
process.env.AUTH_SECRET = "virasat-test-secret-0123456789abcdefghijklmnopqr";
