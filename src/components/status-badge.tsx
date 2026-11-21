const good = new Set(["Open", "Available", "Active", "Approved"]);
const bad = new Set(["Sold", "Closed", "Rejected"]);

export function StatusBadge({ status }: { status: string }) {
  const tone = good.has(status)
    ? "bg-success-bg text-success"
    : bad.has(status)
      ? "bg-danger-bg text-danger"
      : "bg-background text-muted";

  return <span className={`inline-flex max-w-full rounded-md px-2 py-0.5 text-xs ${tone}`}>{status}</span>;
}
