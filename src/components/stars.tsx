export function Stars({ value, count }: { value: number; count: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
      <span className="inline-flex" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < filled ? "text-accent" : "text-line"}>
            ★
          </span>
        ))}
      </span>
      <span>
        {count > 0
          ? `${value.toFixed(1)} · ${count} review${count === 1 ? "" : "s"}`
          : "No reviews yet"}
      </span>
    </p>
  );
}
