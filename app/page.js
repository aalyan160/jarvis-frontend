"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BrainCircuit, Clock3, MessageSquarePlus, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { useToast } from "@/components/Toast";
import { N8N_WEBHOOK_URL } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatRelativeTime, normalizeMessage, truncate } from "@/lib/utils";

const CHAT_HISTORY_TABLE = "n8n_chat_histories";

function isDuplicateConversationTitle(title) {
  return /^\s*=/.test(String(title || ""));
}

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-3 mt-1 text-xl font-bold text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2.5 mt-4 text-lg font-bold text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-3 text-base font-bold text-white">{children}</h3>,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5 marker:text-jarvis-accent">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 marker:text-jarvis-accent">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-jarvis-accent/60 pl-3 text-zinc-400">
      {children}
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-white/[0.08] bg-black/70 p-3 text-[13px] leading-5 text-cyan-100">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => (
    <code
      className={`${className || ""} rounded bg-black/50 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-200`}
      {...props}
    >
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a className="font-semibold text-jarvis-accent underline decoration-jarvis-accent/35 underline-offset-4" href={href}>
      {children}
    </a>
  )
};

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#00BCD4] bg-[linear-gradient(135deg,_#00BCD4,_#006064)] text-white shadow-[0_0_18px_rgba(0,188,212,0.35)]">
        <BrainCircuit className="h-[18px] w-[18px]" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/[0.08] bg-[#202A33] px-4 py-3.5">
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
  const timestamp = formatDateTime(message.created_at);

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#00BCD4] bg-[linear-gradient(135deg,_#00BCD4,_#006064)] text-white shadow-[0_0_18px_rgba(0,188,212,0.35)]">
          <BrainCircuit className="h-[18px] w-[18px]" />
        </div>
      ) : null}
      <div className={`max-w-[86%] sm:max-w-[72%] ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`whitespace-pre-wrap px-4 py-3 text-[15px] leading-6 ${
            isUser
              ? "rounded-2xl rounded-br-md border border-jarvis-accent/20 bg-jarvis-accent/20 text-cyan-50 shadow-[0_8px_28px_rgba(0,212,255,0.08)]"
              : "rounded-2xl rounded-bl-md border border-white/[0.08] bg-[#202A33] text-zinc-100 shadow-[0_8px_28px_rgba(0,0,0,0.16)]"
          }`}
        >
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
          )}
        </div>
        <div className={`mt-1.5 flex items-center gap-1.5 px-1 text-[11px] font-medium text-zinc-600 ${isUser ? "justify-end" : "justify-start"}`}>
          <span>{isUser ? "You" : "Jarvis"}</span>
          {timestamp ? (
            <>
              <span className="h-0.5 w-0.5 rounded-full bg-zinc-700" />
              <Clock3 className="h-3 w-3" />
              <span>{timestamp}</span>
            </>
          ) : null}
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
  const [storageWarning, setStorageWarning] = useState("");
  const [showHistory, setShowHistory] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  function getErrorMessage(fetchError) {
    return fetchError?.message || fetchError?.details || "Unknown Supabase error";
  }

  function setChatStorageWarning(fetchError) {
    setStorageWarning(
      `Chat history is not available: ${getErrorMessage(fetchError)}. You can still chat, but messages may not be saved.`
    );
  }

  function parseJarvisResponse(rawResponse) {
    const text = String(rawResponse ?? "").trim();
    if (!text) return "Done.";

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "string") return parsed;
      if (parsed.reply) return String(parsed.reply);
      if (parsed.output) return String(parsed.output);
      if (parsed.response) return String(parsed.response);
      if (parsed.text) return String(parsed.text);
      if (parsed.message?.content) return String(parsed.message.content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return text;
    }
  }

  async function saveChatMessage(role, content) {
    const type = role === "user" ? "human" : "ai";

    try {
      const { error: saveError } = await supabase
        .from(CHAT_HISTORY_TABLE)
        .insert({
          session_id: activeSessionId,
          message: { type, content, created_at: new Date().toISOString() }
        });

      if (saveError) throw saveError;
      return true;
    } catch (saveError) {
      console.log("Failed to save chat message", saveError);
      setChatStorageWarning(saveError);
      return false;
    }
  }

  async function loadSessions(nextActiveId) {
    setIsLoadingSessions(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from(CHAT_HISTORY_TABLE)
        .select("id,session_id,message")
        .order("id", { ascending: false })
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
            latestPreview: normalized.content,
            latestTimestamp: normalized.created_at,
            lastId: row.id,
            earliestId: row.id,
            messageCount: 1
          });
          return;
        }

        existing.messageCount += 1;
        if (row.id < existing.earliestId) {
          existing.earliestId = row.id;
          existing.firstPreview = normalized.content;
        }
      });

      const nextSessions = Array.from(grouped.values())
        .filter((session) => !isDuplicateConversationTitle(session.firstPreview))
        .sort((a, b) => b.lastId - a.lastId);

      setSessions(nextSessions);

      const selectedId = nextActiveId || activeSessionId || nextSessions[0]?.session_id || crypto.randomUUID();
      setActiveSessionId(selectedId);
      return { selectedId, hasStoredSession: nextSessions.length > 0 };
    } catch (fetchError) {
      console.log("Failed to load chat sessions", fetchError);
      setChatStorageWarning(fetchError);
      const fallbackId = activeSessionId || crypto.randomUUID();
      setActiveSessionId(fallbackId);
      setSessions([]);
      return { selectedId: fallbackId, hasStoredSession: false };
    } finally {
      setIsLoadingSessions(false);
    }
  }

  async function loadConversation(sessionId, options = {}) {
    if (!sessionId) return;
    setIsLoadingMessages(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from(CHAT_HISTORY_TABLE)
        .select("id,message")
        .eq("session_id", sessionId)
        .order("id", { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(
        (data || []).map((row) => ({
          id: row.id,
          ...normalizeMessage(row.message)
        }))
      );
    } catch (fetchError) {
      console.log("Failed to load conversation", fetchError);
      setChatStorageWarning(fetchError);
      if (options.silent) {
        setMessages([]);
      } else {
        setError(`Unable to load this conversation: ${getErrorMessage(fetchError)}`);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }

  useEffect(() => {
    document.title = "Jarvis | Chat";

    async function boot() {
      const result = await loadSessions();
      if (result.hasStoredSession) {
        await loadConversation(result.selectedId);
      } else {
        setMessages([]);
      }
    }

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  }, [input]);

  async function startNewChat() {
    const sessionId = crypto.randomUUID();
    setActiveSessionId(sessionId);
    setMessages([]);
    setInput("");
    setError("");
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
      await saveChatMessage("user", userMessage);

      if (!N8N_WEBHOOK_URL) {
        throw new Error("Jarvis webhook URL is missing.");
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatInput: userMessage,
          sessionId: activeSessionId,
          session_id: activeSessionId,
          action: "chat"
        })
      });

      if (!response.ok) {
        throw new Error(`Jarvis webhook returned ${response.status}`);
      }

      const jarvisResponse = parseJarvisResponse(await response.text());
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: jarvisResponse,
        created_at: new Date().toISOString()
      };

      setMessages((current) => [...current, assistantMessage]);
      await saveChatMessage("assistant", assistantMessage.content);
      await loadSessions(activeSessionId);
    } catch (sendError) {
      console.log("Failed to send message", sendError);
      setError(`Message failed: ${getErrorMessage(sendError)}`);
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
    <div className="grid h-[calc(100dvh-5.5rem)] min-h-[500px] grid-cols-1 gap-4 sm:h-[calc(100dvh-6.5rem)] xl:grid-cols-[310px_minmax(0,1fr)]">
      <section className={`${showHistory ? "flex" : "hidden"} min-h-0 flex-col rounded-xl border border-jarvis-border bg-jarvis-surface xl:flex`}>
        <div className="flex items-center justify-between border-b border-jarvis-border px-4 py-3.5">
          <div>
            <h2 className="text-sm font-bold text-zinc-100">Conversations</h2>
            <p className="mt-0.5 text-xs font-medium text-zinc-600">{sessions.length} saved sessions</p>
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

        <div className="sidebar-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {isLoadingSessions ? <LoadingSkeleton rows={5} /> : null}
          {!isLoadingSessions && sessions.length === 0 ? <EmptyState message="No conversations yet" /> : null}
          {!isLoadingSessions && sessions.length > 0 ? (
            <div className="divide-y divide-white/[0.06]">
              {sessions.map((session) => {
                const active = session.session_id === activeSessionId;

                return (
                  <button
                    type="button"
                    key={session.session_id}
                    onClick={() => selectSession(session.session_id)}
                    className={`relative w-full overflow-hidden rounded-lg border px-3 py-3.5 text-left transition-all before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-r-full before:bg-jarvis-accent ${
                      active
                        ? "border-jarvis-accent/45 bg-jarvis-accent/10 shadow-softGlow before:opacity-100"
                        : "border-transparent bg-transparent before:opacity-0 hover:border-white/[0.08] hover:bg-white/[0.035]"
                    }`}
                  >
                    <div className="truncate text-sm font-semibold text-white">
                      {truncate(session.firstPreview || "New conversation", 44)}
                    </div>
                    <div className="mt-1.5 truncate text-xs leading-5 text-zinc-500">
                      {truncate(session.latestPreview || "No message preview", 54)}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-zinc-700">
                      {session.messageCount} {session.messageCount === 1 ? "message" : "messages"}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-zinc-600">
                      {formatRelativeTime(session.latestTimestamp)}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${showHistory ? "hidden" : "flex"} min-h-0 flex-col rounded-xl border border-jarvis-border bg-jarvis-surface xl:flex`}>
        <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-jarvis-border px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-jarvis-border text-zinc-300 hover:border-jarvis-accent hover:text-jarvis-accent hover:shadow-softGlow xl:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-jarvis-accent/25 bg-jarvis-accent/10 text-jarvis-accent shadow-softGlow">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">Jarvis Main Brain</h2>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <span>GPT-4.1 mini</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span className="text-jarvis-success">Connected</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            className="hidden min-h-11 rounded-lg border border-jarvis-accent bg-jarvis-accent px-4 text-sm font-bold text-black shadow-[0_0_18px_rgba(0,212,255,0.2)] hover:bg-cyan-300 hover:shadow-glow sm:inline-flex sm:items-center sm:gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-black/20 p-4 sm:p-6">
          {storageWarning ? (
            <div className="mb-4 rounded-xl border border-jarvis-warning/30 bg-jarvis-warning/10 p-4 text-sm text-jarvis-warning">
              {storageWarning}
            </div>
          ) : null}
          {error ? <ErrorState message={error} /> : null}
          {isLoadingMessages ? <LoadingSkeleton rows={4} /> : null}
          {!isLoadingMessages && !error && messages.length === 0 ? <EmptyState message="No messages yet" /> : null}
          {!isLoadingMessages ? (
            <div className="mx-auto max-w-4xl space-y-5">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isSending ? <TypingIndicator /> : null}
              <div ref={bottomRef} />
            </div>
          ) : null}
        </div>

        <div className="border-t border-jarvis-border bg-jarvis-surface p-3 sm:p-4">
          <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-xl border border-white/[0.09] bg-black/80 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.28)] transition-[box-shadow,border-color] duration-200 ease-in-out focus-within:border-[#00BCD4] focus-within:shadow-[0_0_0_2px_rgba(0,188,212,0.3)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isSending}
              rows={1}
              placeholder="Message Jarvis"
              className="max-h-36 min-h-12 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-3.5 py-3 text-[15px] leading-6 text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#00BCD4]/50 bg-[#00BCD4]/10 text-[#00BCD4] shadow-[0_0_18px_rgba(0,188,212,0.18)] transition-all duration-200 ease-in-out hover:scale-110 hover:bg-[#00BCD4]/20 hover:text-white hover:brightness-[1.3] hover:shadow-[0_0_24px_rgba(0,188,212,0.4)] disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-900 disabled:text-[#00BCD4]/35 disabled:shadow-none disabled:hover:scale-100 disabled:hover:brightness-100"
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
