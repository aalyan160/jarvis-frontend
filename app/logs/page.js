"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { STATUS_OPTIONS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { formatDateTime, normalizedKey, readableStatus, statusClass, stringifyValue, truncate } from "@/lib/utils";

function ExpandablePreview({ label, value, expanded, onToggle }) {
  const text = stringifyValue(value);
  if (!text) return null;

  return (
    <div className="rounded-lg border border-jarvis-border bg-black p-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-8 w-full items-center justify-between gap-3 text-left text-xs font-bold uppercase text-zinc-500 hover:text-jarvis-accent"
      >
        {label}
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
        {expanded ? text : truncate(text, 60)}
      </pre>
    </div>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [expanded, setExpanded] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Jarvis | Tool Logs";

    async function loadLogs() {
      try {
        const { data, error: fetchError } = await supabase
          .from("tool_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setLogs(data || []);
      } catch (fetchError) {
        console.log("Failed to load tool logs", fetchError);
        setError("Unable to load tool logs.");
      } finally {
        setIsLoading(false);
      }
    }

    loadLogs();
  }, []);

  const visibleLogs = useMemo(() => {
    if (activeFilter === "All") return logs;
    return logs.filter((log) => normalizedKey(log.status) === normalizedKey(activeFilter));
  }, [activeFilter, logs]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap gap-2 rounded-xl border border-jarvis-border bg-jarvis-surface p-1">
        {STATUS_OPTIONS.logs.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`min-h-11 flex-1 rounded-lg px-4 text-sm font-bold transition-all sm:flex-none ${
              activeFilter === filter
                ? "bg-jarvis-accent text-black shadow-glow"
                : "text-zinc-400 hover:bg-jarvis-accent/10 hover:text-jarvis-accent"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingSkeleton rows={7} /> : null}
      {!isLoading && !error && visibleLogs.length === 0 ? <EmptyState /> : null}
      {!isLoading && !error && visibleLogs.length > 0 ? (
        <div className="grid gap-3">
          {visibleLogs.map((log) => (
            <article
              key={log.id}
              className="rounded-xl border border-jarvis-border bg-jarvis-card p-4 transition-all hover:border-jarvis-accent/35 hover:shadow-softGlow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 flex-1 truncate text-base font-bold text-jarvis-accent">
                  {log.tool_name || log.name || "Tool"}
                </h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(log.status)}`}>
                  {readableStatus(log.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ExpandablePreview
                  label="Input"
                  value={log.input}
                  expanded={Boolean(expanded[`${log.id}-input`])}
                  onToggle={() => setExpanded((current) => ({ ...current, [`${log.id}-input`]: !current[`${log.id}-input`] }))}
                />
                <ExpandablePreview
                  label="Output"
                  value={log.output}
                  expanded={Boolean(expanded[`${log.id}-output`])}
                  onToggle={() => setExpanded((current) => ({ ...current, [`${log.id}-output`]: !current[`${log.id}-output`] }))}
                />
              </div>

              {log.error_message ? (
                <div className="mt-3 rounded-lg border border-jarvis-error/30 bg-jarvis-error/10 p-3 text-sm text-jarvis-error">
                  {log.error_message}
                </div>
              ) : null}

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
                <Clock className="h-4 w-4" />
                {formatDateTime(log.created_at)}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
