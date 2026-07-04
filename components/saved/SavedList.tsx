"use client";

import { useState, memo } from "react";
import Link from "next/link";
import type { SavedItemRecord, SavedItemType } from "@/lib/types";
import { ErrorAlert } from "@/components/ErrorAlert";
import { readApiError } from "@/components/api";

const TYPE_LABEL: Record<SavedItemType, string> = {
  attraction: "Attraction",
  "hidden-gem": "Hidden gem",
  event: "Festival & event",
  story: "Story",
};

const TYPE_BADGE: Record<SavedItemType, string> = {
  attraction: "bg-maroon/10 text-maroon-deep",
  "hidden-gem": "bg-leaf/10 text-leaf",
  event: "bg-saffron/10 text-saffron",
  story: "bg-ink/10 text-ink",
};

// Fixed locale + UTC keeps server render and client hydration identical.
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function humanizeKey(key: string): string {
  const spaced = key.replace(/([A-Z])/g, (m) => ` ${m.toLowerCase()}`).trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function PayloadDetails({ item }: { item: SavedItemRecord }) {
  if (item.itemType === "story") {
    const storyText = item.payload?.storyText;
    return typeof storyText === "string" && storyText.length > 0 ? (
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{storyText}</p>
    ) : (
      <p className="text-sm text-ink/70">The full story text was not stored with this item.</p>
    );
  }

  const entries = Object.entries(item.payload ?? {}).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
  );
  if (entries.length === 0) {
    return <p className="text-sm text-ink/70">No additional details were stored with this item.</p>;
  }
  return (
    <dl className="space-y-3 text-sm">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt className="font-medium text-ink/70">{humanizeKey(key)}</dt>
          <dd className="leading-relaxed">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export const SavedList = memo(function SavedListComponent({
  initialItems,
}: {
  initialItems: SavedItemRecord[];
}) {
  const [items, setItems] = useState(initialItems);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(item: SavedItemRecord) {
    setDeletingId(item.id);
    setError(null);
    try {
      const res = await fetch(`/api/saved/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(await readApiError(res, `Could not delete (HTTP ${res.status}).`));
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setAnnouncement(`Removed “${item.title}” from your saved items.`);
    } catch {
      setError("Network error — the item was not deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <ErrorAlert message={error} />
      <p aria-live="polite" className="text-sm text-leaf">
        {announcement}
      </p>
      {items.length === 0 ? (
        <div className="card text-sm text-ink/80">
          <p>
            Your collection is now empty. Visit{" "}
            <Link href="/discover" className="font-medium text-maroon underline underline-offset-2">
              Discover
            </Link>{" "}
            to find something new to save.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${TYPE_BADGE[item.itemType]}`}
                  >
                    {TYPE_LABEL[item.itemType]}
                  </span>
                  <h2 className="mt-2 text-xl text-maroon-deep">{item.title}</h2>
                  <p className="mt-1 text-sm text-ink/70">
                    {item.region ? `${item.region} · ` : ""}
                    Saved on {dateFormatter.format(new Date(item.createdAt))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  disabled={deletingId === item.id}
                  className="btn-secondary px-4 py-1.5 text-xs"
                >
                  {deletingId === item.id ? "Deleting…" : "Delete"}
                </button>
              </div>
              {item.summary && (
                <p className="mt-3 text-sm leading-relaxed text-ink/80">{item.summary}</p>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer rounded-md text-sm font-medium text-maroon hover:text-maroon-deep">
                  Full details
                </summary>
                <div className="mt-3 border-t border-ink/10 pt-3">
                  <PayloadDetails item={item} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
