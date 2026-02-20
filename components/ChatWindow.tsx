"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message, ChatSessionDetail } from "@/types/chat";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import RagToggle from "./chat/RagToggle";
import { useAuthStore } from "@/lib/store/authStore";

const handleUnauthorized = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const CHAT_STREAM_URL = `${API_URL}/chat/stream`;
const CHAT_STREAM_FILE_URL = `${API_URL}/chat/stream-with-file`;
const RAG_QUERY_URL = `${API_URL}/rag/query`;

interface ChatWindowProps {
  activeSessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
}

export default function ChatWindow({ activeSessionId, onSessionCreated }: ChatWindowProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [useRag, setUseRag] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(activeSessionId);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages when activeSessionId changes from parent
  useEffect(() => {
    setSessionId(activeSessionId);
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    // Fetch session detail
    (async () => {
      try {
        const res = await fetch(`${API_URL}/chats/${activeSessionId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (!res.ok) return;
        const data: ChatSessionDetail = await res.json();
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            file_name: m.file_name,
          }))
        );
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    })();
  }, [activeSessionId, accessToken]);

  // Cancel the in-flight stream
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    );
    setStreaming(false);
  }, []);

  const handleSend = async (text: string, file?: File) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text || (file ? `Uploaded file: ${file.name}` : ""),
      file_name: file?.name,
    };

    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    const updatedMessages = [...messages, userMessage, assistantMessage];
    setMessages(updatedMessages);
    setStreaming(true);

    // Send only previous completed messages as history (exclude the new empty assistant placeholder)
    const history = messages
      .filter((m) => m.content.length > 0)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      if (useRag) {
        await runRagQuery(text, assistantId);
      } else if (file) {
        await streamChatWithFile(text, history, assistantId, file);
      } else {
        await streamChat(text, history, assistantId);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // User clicked Stop
      } else {
        console.error("Chat Error:", error);
      }
      setStreaming(false);
    }
  };

  // -------------------------
  // NORMAL CHAT (STREAMING)
  // -------------------------
  const streamChat = async (
    prompt: string,
    history: { role: string; content: string }[],
    assistantId: string
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const res = await fetch(CHAT_STREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ prompt, history, session_id: sessionId }),
      signal: controller.signal,
    });

    if (res.status === 401) { handleUnauthorized(); return; }
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const trimmed = event.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(trimmed.indexOf(":") + 1).trim();
        try {
          const payload = JSON.parse(jsonStr);
          handleStreamEvent(payload, assistantId);
        } catch (e) {
          console.warn("Failed to parse SSE event:", jsonStr);
        }
      }
    }
  };

  // -------------------------
  // STREAMING WITH FILE
  // -------------------------
  const streamChatWithFile = async (
    prompt: string,
    history: { role: string; content: string }[],
    assistantId: string,
    file: File
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const formData = new FormData();
    formData.append("prompt", prompt || `Analyze this file: ${file.name}`);
    formData.append("history", JSON.stringify(history));
    if (sessionId) formData.append("session_id", sessionId);
    formData.append("file", file);

    const res = await fetch(CHAT_STREAM_FILE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
      signal: controller.signal,
    });

    if (res.status === 401) { handleUnauthorized(); return; }
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const trimmed = event.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(trimmed.indexOf(":") + 1).trim();
        try {
          const payload = JSON.parse(jsonStr);
          handleStreamEvent(payload, assistantId);
        } catch (e) {
          console.warn("Failed to parse SSE event:", jsonStr);
        }
      }
    }
  };

  // -------------------------
  // RAG QUERY (NON-STREAM)
  // -------------------------
  const runRagQuery = async (query: string, assistantId: string) => {
    const form = new FormData();
    form.append("query", query);
    form.append("top_k", "5");

    const res = await fetch(RAG_QUERY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    if (res.status === 401) { handleUnauthorized(); return; }
    if (!res.ok) throw new Error("RAG Query Failed");

    const data = await res.json();

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, content: data.answer, sources: data.sources, streaming: false }
          : m
      )
    );
    setStreaming(false);
  };

  // -------------------------
  // STREAM EVENT HANDLER
  // -------------------------
  const handleStreamEvent = (
    event: { type: string; value?: any; session_id?: string },
    assistantId: string
  ) => {
    if (event.type === "token") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: m.content + event.value }
            : m
        )
      );
    }

    if (event.type === "done") {
      // Capture the session_id returned by the backend (for new chats)
      if (event.session_id && !sessionId) {
        setSessionId(event.session_id);
        onSessionCreated(event.session_id);
      } else {
        // Existing session — still refresh the sidebar to update timestamp/title
        onSessionCreated(sessionId || "");
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      );
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      {/* Header / Toolbar */}
      <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-semibold text-zinc-600">
            {sessionId ? "Chat Session" : "New Chat"}
          </span>
        </div>
        <RagToggle enabled={useRag} onChange={setUseRag} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-zinc-300">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 opacity-60">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-lg font-medium">Start a conversation</p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <ChatInput
        onSend={handleSend}
        disabled={streaming}
        isStreaming={streaming}
        onStop={handleStop}
      />
    </div>
  );
}