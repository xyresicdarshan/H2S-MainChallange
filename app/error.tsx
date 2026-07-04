"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-3xl text-maroon-deep">Something went wrong</h1>
      <p className="mt-4 text-ink/70">
        An unexpected error interrupted this page. Nothing was lost — you can try again.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-ink/70">Error reference: {error.digest}</p>
      )}
      <button type="button" onClick={reset} className="btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
