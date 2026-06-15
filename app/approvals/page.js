"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { approvalActionClass, formatDateTime, readableStatus, statusClass, stringifyValue } from "@/lib/utils";

function ApprovalCard({ approval, isPending, expanded, onToggle, onDecision }) {
  const payload = stringifyValue(approval.payload);

  return (
    <article className="rounded-xl border border-jarvis-border bg-jarvis-card p-4 transition-all hover:border-jarvis-accent/35 hover:shadow-softGlow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${approvalActionClass(approval.action_type)}`}>
          {approval.action_type || "Action"}
        </span>
        <span className="text-xs text-zinc-600">{formatDateTime(approval.created_at)}</span>
      </div>

      <h2 className="mt-4 text-base font-bold leading-snug text-white">{approval.action_summary || "Approval request"}</h2>

      <button
        type="button"
        onClick={onToggle}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-jarvis-border px-3 text-sm font-semibold text-zinc-300 hover:border-jarvis-accent hover:text-jarvis-accent hover:shadow-softGlow"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        View Details
      </button>

      {expanded ? (
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-jarvis-border bg-black p-3 text-xs leading-relaxed text-zinc-300">
          {payload || "{}"}
        </pre>
      ) : null}

      <div className="mt-5">
        {isPending ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onDecision(approval.id, "approved")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-jarvis-success px-4 text-sm font-extrabold text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.25)]"
            >
              <Check className="h-5 w-5" />
              APPROVE
            </button>
            <button
              type="button"
              onClick={() => onDecision(approval.id, "rejected")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-jarvis-error px-4 text-sm font-extrabold text-white hover:shadow-[0_0_20px_rgba(255,68,68,0.25)]"
            >
              <X className="h-5 w-5" />
              REJECT
            </button>
          </div>
        ) : (
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(approval.status)}`}>
            {readableStatus(approval.status)}
          </span>
        )}
      </div>
    </article>
  );
}

export default function ApprovalsPage() {
  const { showToast } = useToast();
  const [approvals, setApprovals] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [expanded, setExpanded] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApprovals() {
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("approvals")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setApprovals(data || []);
    } catch (fetchError) {
      console.log("Failed to load approvals", fetchError);
      setError("Unable to load approvals.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Jarvis | Approvals";
    loadApprovals();

    const channel = supabase
      .channel("approvals-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "approvals" }, loadApprovals)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pending = useMemo(() => approvals.filter((approval) => approval.status === "pending"), [approvals]);
  const history = useMemo(() => approvals.filter((approval) => approval.status !== "pending"), [approvals]);
  const visibleApprovals = activeTab === "pending" ? pending : history;

  async function updateStatus(id, status) {
    try {
      const { error: updateError } = await supabase
        .from("approvals")
        .update({ status })
        .eq("id", id);

      if (updateError) throw updateError;

      showToast(status === "approved" ? "Approval accepted" : "Approval rejected", status === "approved" ? "success" : "error");
      await loadApprovals();
    } catch (updateError) {
      console.log("Failed to update approval", updateError);
      showToast("Approval update failed", "error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-jarvis-border bg-jarvis-surface p-1">
        {[
          ["pending", `Pending (${pending.length})`],
          ["history", `History (${history.length})`]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-bold transition-all sm:flex-none ${
              activeTab === key
                ? "bg-jarvis-accent text-black shadow-glow"
                : "text-zinc-400 hover:bg-jarvis-accent/10 hover:text-jarvis-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingSkeleton rows={5} /> : null}
      {!isLoading && !error && visibleApprovals.length === 0 ? <EmptyState /> : null}
      {!isLoading && !error && visibleApprovals.length > 0 ? (
        <div className="grid gap-4">
          {visibleApprovals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              isPending={activeTab === "pending"}
              expanded={Boolean(expanded[approval.id])}
              onToggle={() => setExpanded((current) => ({ ...current, [approval.id]: !current[approval.id] }))}
              onDecision={updateStatus}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
