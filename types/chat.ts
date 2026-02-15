export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  sources?: any[];
  streaming?: boolean;
};

// ---------- Chat History (persisted) ----------

export interface ChatSessionSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageOut {
  id: string;
  role: Role;
  content: string;
  created_at: string;
}

export interface ChatSessionDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessageOut[];
}