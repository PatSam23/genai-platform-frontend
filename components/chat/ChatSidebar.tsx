"use client";

import { useEffect, useState, useCallback } from "react";
import { ChatSessionSummary } from "@/types/chat";
import { useAuthStore } from "@/lib/store/authStore";
import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ChatSidebarProps {
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  refreshKey: number; // bump to re-fetch list
}

export default function ChatSidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
  refreshKey,
}: ChatSidebarProps) {
  const { accessToken } = useAuthStore();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data: ChatSessionSummary[] = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshKey]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/chats/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        onNewChat();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="w-72 bg-zinc-900 text-white flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-zinc-500 text-xs text-center py-8">
            No conversations yet
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              role="button"
              className={`group w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${
                activeSessionId === s.id
                  ? "bg-zinc-700/70"
                  : "hover:bg-zinc-800"
              }`}
            >
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-zinc-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatDate(s.updated_at)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all shrink-0"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
