export function ErrorAlert({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-maroon/30 bg-maroon/5 px-4 py-3 text-sm text-maroon-deep"
    >
      {message}
    </div>
  );
}
