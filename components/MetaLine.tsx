export function MetaLine({ model, latencyMs }: { model: string; latencyMs?: number }) {
  return (
    <p className="text-xs text-ink/70">
      Generated live by {model}
      {latencyMs !== undefined ? ` in ${(latencyMs / 1000).toFixed(1)}s` : ""}
    </p>
  );
}
