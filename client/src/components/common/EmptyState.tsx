import { ReactNode } from "react";

export default function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="text-ink/70">{title}</p>
      {action}
    </div>
  );
}
