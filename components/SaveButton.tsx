"use client";

import { useState } from "react";
import Link from "next/link";
import type { SavedItemInput } from "@/lib/types";
import { readApiError } from "@/components/api";

type SaveState = "idle" | "saving" | "saved";

export function SaveButton({ item }: { item: SavedItemInput }) {
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  async function save() {
    setError(null);
    setNeedsLogin(false);
    setState("saving");
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.status === 401) {
        setNeedsLogin(true);
        setState("idle");
        return;
      }
      if (!res.ok) {
        setError(await readApiError(res, `Could not save (HTTP ${res.status}).`));
        setState("idle");
        return;
      }
      setState("saved");
    } catch {
      setError("Network error — the item was not saved.");
      setState("idle");
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {/* aria-disabled (not disabled) keeps keyboard focus on the button when
          it deactivates, and the sr-only status region announces success —
          WCAG 4.1.3 Status Messages. */}
      <button
        type="button"
        onClick={state === "idle" ? save : undefined}
        aria-disabled={state !== "idle"}
        className="btn-secondary px-4 py-1.5 text-xs aria-disabled:opacity-60"
      >
        {state === "saved" ? "Saved" : state === "saving" ? "Saving…" : "Save"}
      </button>
      <span role="status" className="sr-only">
        {state === "saved" ? "Saved to your collection." : ""}
      </span>
      {needsLogin && (
        <span role="alert" className="text-xs text-maroon-deep">
          <Link href="/login" className="font-medium underline underline-offset-2">
            Log in
          </Link>{" "}
          to save items.
        </span>
      )}
      {error && (
        <span role="alert" className="text-xs text-maroon-deep">
          {error}
        </span>
      )}
    </span>
  );
}
