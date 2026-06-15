import { AlertTriangle, Inbox } from "lucide-react";

export function EmptyState({ message = "No data yet" }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-jarvis-border bg-jarvis-surface/40 px-6 text-center">
      <Inbox className="h-10 w-10 text-zinc-600" />
      <p className="mt-3 text-sm font-medium text-zinc-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-jarvis-error/35 bg-jarvis-error/10 p-4 text-sm text-jarvis-error">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{message || "Something went wrong."}</span>
    </div>
  );
}
