export function LoadingIndicator({ label }: { label: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-ink/10 bg-parchment px-4 py-3 text-sm text-ink"
    >
      <span aria-hidden="true" className="flex gap-1.5">
        <span className="h-2 w-2 animate-pulse rounded-full bg-saffron" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-maroon [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-leaf [animation-delay:300ms]" />
      </span>
      <span>{label}</span>
    </div>
  );
}
