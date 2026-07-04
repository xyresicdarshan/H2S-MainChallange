"use client";

import { useState } from "react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Full navigation so the server re-renders the header without a session.
      location.assign("/");
    }
  }

  return (
    <button type="button" onClick={logout} disabled={busy} className="btn-secondary px-4 py-2 text-xs">
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}
