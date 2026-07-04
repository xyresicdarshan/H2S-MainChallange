"use client";

import { useState, type FormEvent } from "react";
import { ErrorAlert } from "@/components/ErrorAlert";
import { readApiError } from "@/components/api";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "Enter your name.";
    if (!email.trim() || !email.includes("@")) errors.email = "Enter a valid email address.";
    // Mirror the server rule (lib/validation/auth.ts) so users are not
    // misled into a round-trip failure.
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = "Password must be at least 8 characters and include a letter and a digit.";
    }
    setFieldErrors(errors);
    if (errors.name || errors.email || errors.password) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      if (!res.ok) {
        setError(await readApiError(res, `Registration failed (HTTP ${res.status}).`));
        return;
      }
      location.assign("/discover");
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
        <label htmlFor="register-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
          className="field-input mt-1.5"
        />
        {fieldErrors.name && (
          <p id="register-name-error" role="alert" className="mt-1.5 text-sm text-maroon-deep">
            {fieldErrors.name}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
          className="field-input mt-1.5"
        />
        {fieldErrors.email && (
          <p id="register-email-error" role="alert" className="mt-1.5 text-sm text-maroon-deep">
            {fieldErrors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={
            fieldErrors.password ? "register-password-error register-password-hint" : "register-password-hint"
          }
          className="field-input mt-1.5"
        />
        <p id="register-password-hint" className="mt-1.5 text-xs text-ink/70">
          At least 8 characters, including a letter and a digit.
        </p>
        {fieldErrors.password && (
          <p id="register-password-error" role="alert" className="mt-1.5 text-sm text-maroon-deep">
            {fieldErrors.password}
          </p>
        )}
      </div>
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
