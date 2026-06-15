"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { STATUS_OPTIONS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { formatDate, formatDateTime, normalizedKey, readableStatus, statusClass } from "@/lib/utils";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Jarvis | Tasks";

    async function loadTasks() {
      try {
        const { data, error: fetchError } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setTasks(data || []);
      } catch (fetchError) {
        console.log("Failed to load tasks", fetchError);
        setError("Unable to load tasks.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTasks();
  }, []);

  const visibleTasks = useMemo(() => {
    if (activeFilter === "All") return tasks;
    return tasks.filter((task) => normalizedKey(task.status) === normalizedKey(activeFilter));
  }, [activeFilter, tasks]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap gap-2 rounded-xl border border-jarvis-border bg-jarvis-surface p-1">
        {STATUS_OPTIONS.tasks.map((filter) => (
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
      {isLoading ? <LoadingSkeleton rows={6} /> : null}
      {!isLoading && !error && visibleTasks.length === 0 ? <EmptyState /> : null}
      {!isLoading && !error && visibleTasks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-xl border border-jarvis-border bg-jarvis-card p-4 transition-all hover:border-jarvis-accent/35 hover:shadow-softGlow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 flex-1 text-base font-bold leading-snug text-white">{task.title || "Untitled task"}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(task.priority)}`}>
                  {readableStatus(task.priority || "Low")}
                </span>
              </div>

              {task.description ? (
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{task.description}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusClass(task.status)}`}>
                  {readableStatus(task.status)}
                </span>
                {task.due_date ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-zinc-300">
                    <CalendarClock className="h-3.5 w-3.5 text-jarvis-accent" />
                    {formatDate(task.due_date)}
                  </span>
                ) : null}
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-zinc-600">
                <Clock className="h-4 w-4" />
                {formatDateTime(task.created_at)}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
