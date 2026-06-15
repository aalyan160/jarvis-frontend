"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageSquarePlus, PanelLeftOpen, Send } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { useToast } from "@/components/Toast";
import { N8N_WEBHOOK_URL } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { formatDateTime, normalizeMessage, truncate } from "@/lib/utils";

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-jarvis-accent/40 bg-jarvis-accent/10 text-sm font-extrabold text-jarvis-accent shadow-softGlow">
        J
      </div>
      <div className="flex items-center gap-1 rounded-[20px] border border-jarvis-border bg-jarvis-card px-4 py-3">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-2 w-2 rounded-full bg-jarvis-accent animate-bounceDot"
            style={{ animationDelay: `${dot * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-jarvis-accent/40 bg-jarvis-accent/10 text-sm font-extrabold text-jarvis-accent shadow-softGlow">
          J
        </div>
      ) : null}
      <div className={`max-w-[84%] sm:max-w-[70%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`whitespace-pre-wrap rounded-[20px] px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-jarvis-accent/20 text-white"
              : "border border-jarvis-border bg-jarvis-card text-white"
          }`}
        >
          {message.content}
        </div>
        <div className="mt-1 px-2 text-[11px] text-zinc-600">
          {formatDateTime(message.created_at || Date.now())}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const bottomRef = useRef(null);

  const truncatedSessionId = useMemo(() => {
    if (!activeSessionId) return "";
    return activeSessionId.length > 18 ? `${activeSessionId.slice(0, 8)}...${activeSessionId.slice(-6)}` : activeSessionId;
  }, [activeSessionId]);

  async function loadSessions(nextActiveId) {
    setIsLoadingSessions(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("n8n_chat_history")
        .select("session_id,message,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (fetchError) throw fetchError;

      const grouped = new Map();
      (data || []).forEach((row) => {
        if (!row.session_id) return;
        const normalized = normalizeMessage(row.message);
        const existing = grouped.get(row.session_id);

        if (!existing) {
          grouped.set(row.session_id, {
            session_id: row.session_id,
            firstPreview: normalized.content,
            lastTimestamp: row.created_at,
            earliestTimestamp: row.created_at
          });
          return;
        }

        if (new Date(row.created_at).getTime() < new Date(existing.earliestTimestamp).getTime()) {
          existing.earliestTimestamp = row.created_at;
          existing.firstPreview = normalized.content;
        }
      });

      const nextSessions = Array.from(grouped.values()).sort(
        (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
      );

      setSessions(nextSessions);

      const selectedId = nextActiveId || activeSessionId || nextSessions[0]?.session_id || crypto.randomUUID();
      setActiveSessionId(selectedId);
      return selectedId;
    } catch (fetchError) {
      console.log("Failed to load chat sessions", fetchError);
      setError("Unable to load chat history.");
      const fallbackId = activeSessionId || crypto.randomUUID();
      setActiveSessionId(fallbackId);
      return fallbackId;
    } finally {
      setIsLoadingSessions(false);
    }
  }

  async function loadConversation(sessionId) {
    if (!sessionId) return;
    setIsLoadingMessages(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("n8n_chat_history")
        .select("id,message,created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(
        (data || []).map((row) => ({
          id: row.id,
          ...normalizeMessage(row.message),
          created_at: row.created_at
        }))
      );
    } catch (fetchError) {
      console.log("Failed to load conversation", fetchError);
      setError("Unable to load this conversation.");
    } finally {
      setIsLoadingMessages(false);
    }
  }

  useEffect(() => {
    document.title = "Jarvis | Chat";

    async function boot() {
      const selectedId = await loadSessions();
      await loadConversation(selectedId);
    }

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  async function startNewChat() {
    const sessionId = crypto.randomUUID();
    setActiveSessionId(sessionId);
    setMessages([]);
    setInput("");
    setShowHistory(false);
  }

  async function selectSession(sessionId) {
    setActiveSessionId(sessionId);
    setShowHistory(false);
    await loadConversation(sessionId);
  }

  async function sendMessage() {
    const userMessage = input.trim();
    if (!userMessage || isSending || !activeSessionId) return;

    setInput("");
    setIsSending(true);
    setError("");

    const now = new Date().toISOString();
    const optimisticUser = {
      id: `user-${now}`,
      role: "user",
      content: userMessage,
      created_at: now
    };

    setMessages((current) => [...current, optimisticUser]);

    try {
      const { error: userSaveError } = await supabase
        .from("n8n_chat_history")
        .insert({
          session_id: activeSessionId,
          message: { role: "user", content: userMessage }
        });

      if (userSaveError) throw userSaveError;

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatInput: userMessage,
          session_id: activeSessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Jarvis webhook returned ${response.status}`);
      }

      const jarvisResponse = await response.text();
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: jarvisResponse || "Done.",
        created_at: new Date().toISOString()
      };

      const { error: assistantSaveError } = await supabase
        .from("n8n_chat_history")
        .insert({
          session_id: activeSessionId,
          message: { role: "assistant", content: assistantMessage.content }
        });

      if (assistantSaveError) throw assistantSaveError;

      setMessages((current) => [...current, assistantMessage]);
      await loadSessions(activeSessionId);
    } catch (sendError) {
      console.log("Failed to send message", sendError);
      showToast("Message failed to send", "error");
    } finally {
      setIsSending(false);
    }
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="grid h-[calc(100dvh-6rem)] min-h-[620px] grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <section className={`${showHistory ? "flex" : "hidden"} min-h-0 flex-col rounded-xl border border-jarvis-border bg-jarvis-surface xl:flex`}>
        <div className="flex items-center justify-between border-b border-jarvis-border p-4">
          <div>
            <h2 className="text-sm font-bold uppercase text-zinc-300">Conversations</h2>
            <p className="mt-1 text-xs text-zinc-600">{sessions.length} sessions</p>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="grid h-11 w-11 place-items-center rounded-lg border border-jarvis-accent/40 bg-jarvis-accent/10 text-jarvis-accent hover:shadow-glow"
            aria-label="New chat"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoadingSessions ? <LoadingSkeleton rows={5} /> : null}
          {!isLoadingSessions && sessions.length === 0 ? <EmptyState message="No conversations yet" /> : null}
          {!isLoadingSessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => {
                const active = session.session_id === activeSessionId;

                return (
                  <button
                    type="button"
                    key={session.session_id}
                    onClick={() => selectSession(session.session_id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-jarvis-accent bg-jarvis-accent/10 shadow-softGlow"
                        : "border-jarvis-border bg-jarvis-card hover:border-jarvis-accent/40 hover:shadow-softGlow"
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{truncate(session.firstPreview || "New conversation", 40)}</div>
                    <div className="mt-2 text-xs text-zinc-500">{formatDateTime(session.lastTimestamp)}</div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${showHistory ? "hidden" : "flex"} min-h-0 flex-col rounded-xl border border-jarvis-border bg-jarvis-surface xl:flex`}>
        <div className="flex items-center justify-between gap-3 border-b border-jarvis-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-jarvis-border text-zinc-300 hover:border-jarvis-accent hover:text-jarvis-accent hover:shadow-softGlow xl:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="hidden h-10 w-10 place-items-center rounded-lg border border-jarvis-border text-zinc-300 hover:border-jarvis-accent hover:text-jarvis-accent hover:shadow-softGlow xl:grid"
              aria-label="Show conversations"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs uppercase text-zinc-600">Session</p>
              <h2 className="truncate text-sm font-semibold text-white">{truncatedSessionId}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="hidden min-h-11 rounded-lg border border-jarvis-accent/40 bg-jarvis-accent/10 px-4 text-sm font-semibold text-jarvis-accent hover:shadow-glow sm:inline-flex sm:items-center sm:gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {error ? <ErrorState message={error} /> : null}
          {isLoadingMessages ? <LoadingSkeleton rows={4} /> : null}
          {!isLoadingMessages && !error && messages.length === 0 ? <EmptyState message="No messages yet" /> : null}
          {!isLoadingMessages ? (
            <div className="space-y-5">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isSending ? <TypingIndicator /> : null}
              <div ref={bottomRef} />
            </div>
          ) : null}
        </div>

        <div className="border-t border-jarvis-border p-3 sm:p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isSending}
              rows={1}
              placeholder="Message Jarvis"
              className="max-h-36 min-h-11 flex-1 resize-none rounded-lg border border-jarvis-border bg-black px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-jarvis-accent focus:shadow-softGlow disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-jarvis-accent text-black hover:shadow-glow disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500 disabled:shadow-none"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
