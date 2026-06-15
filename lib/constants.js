export const APP_NAME = "JARVIS";

export const PAGE_TITLES = {
  "/": "Chat",
  "/approvals": "Approvals",
  "/tasks": "Tasks",
  "/contacts": "Contacts",
  "/logs": "Tool Logs"
};

export const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

export const STATUS_OPTIONS = {
  tasks: ["All", "Pending", "In Progress", "Completed"],
  logs: ["All", "Success", "Error"]
};

export const ACTION_TYPE_CLASSES = {
  email: "border-blue-400/30 bg-blue-400/10 text-blue-200",
  whatsapp: "border-jarvis-success/30 bg-jarvis-success/10 text-jarvis-success",
  default: "border-white/10 bg-white/5 text-zinc-300"
};
