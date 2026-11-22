import type { ReactNode } from "react";

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="mt-5 rounded-xl border border-line bg-card p-6">
      <p className="text-base">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
