export function truncate(value, length = 60) {
  const text = String(value ?? "");
  if (text.length <= length) return text;
  return `${text.slice(0, Math.max(0, length - 1))}...`;
}

export function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function normalizeMessage(message) {
  if (!message) {
    return { role: "assistant", content: "" };
  }

  if (typeof message === "string") {
    try {
      const parsed = JSON.parse(message);
      return normalizeMessage(parsed);
    } catch {
      return { role: "assistant", content: message };
    }
  }

  if (message.type === "human") {
    return {
      role: "user",
      content: String(message.content ?? message.text ?? "")
    };
  }

  if (message.type === "ai" || message.type === "assistant") {
    return {
      role: "assistant",
      content: String(message.content ?? message.text ?? "")
    };
  }

  return {
    role: message.role === "user" ? "user" : "assistant",
    content: String(message.content ?? message.text ?? "")
  };
}

export function stringifyValue(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function readableStatus(status) {
  return String(status ?? "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizedKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "_");
}

export function contactColor(name) {
  const palette = ["#00D4FF", "#00FF88", "#FFB800", "#FF6B6B", "#B77CFF", "#4DFFDF"];
  const text = String(name ?? "JARVIS");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = text.charCodeAt(index) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
}

export function approvalActionClass(actionType) {
  const key = normalizedKey(actionType);
  if (key.includes("email")) return "border-blue-400/30 bg-blue-400/10 text-blue-200";
  if (key.includes("whatsapp")) return "border-jarvis-success/30 bg-jarvis-success/10 text-jarvis-success";
  return "border-white/10 bg-white/5 text-zinc-300";
}

export function statusClass(status) {
  const key = normalizedKey(status);
  if (key.includes("approved") || key.includes("completed") || key.includes("success")) {
    return "border-jarvis-success/30 bg-jarvis-success/10 text-jarvis-success";
  }
  if (key.includes("reject") || key.includes("error") || key.includes("failed")) {
    return "border-jarvis-error/30 bg-jarvis-error/10 text-jarvis-error";
  }
  if (key.includes("progress") || key.includes("medium") || key.includes("pending")) {
    return "border-jarvis-warning/30 bg-jarvis-warning/10 text-jarvis-warning";
  }
  if (key.includes("high")) {
    return "border-jarvis-error/30 bg-jarvis-error/10 text-jarvis-error";
  }
  if (key.includes("low")) {
    return "border-jarvis-success/30 bg-jarvis-success/10 text-jarvis-success";
  }
  return "border-white/10 bg-white/5 text-zinc-300";
}
