"use client";

import { useState, type FormEvent } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { readApiError } from "@/components/api";

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "Enter your email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        setError(await readApiError(res, `Login failed (HTTP ${res.status}).`));
        return;
      }
      // Open-redirect guard: only follow same-origin relative paths ("/x").
      // Rejects "//host" AND "/\host" — browsers normalize backslashes to
      // slashes in URLs, so "/\evil.com" would navigate off-origin.
      const target = next && /^\/(?![/\\])/.test(next) ? next : "/discover";
      location.assign(target);
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5">
      <ErrorAlert message={error} />
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          className="field-input mt-1.5"
        />
        {fieldErrors.email && (
          <p id="login-email-error" role="alert" className="mt-1.5 text-sm text-maroon-deep">
            {fieldErrors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
          className="field-input mt-1.5"
        />
        {fieldErrors.password && (
          <p id="login-password-error" role="alert" className="mt-1.5 text-sm text-maroon-deep">
            {fieldErrors.password}
          </p>
        )}
      </div>
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
