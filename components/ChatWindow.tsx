"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import RagToggle from "./chat/RagToggle";
import { useAuthStore } from "@/lib/store/authStore";

const CHAT_STREAM_URL = 
  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/chat/stream`;

const RAG_QUERY_URL =
  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/rag/query`;

export default function ChatWindow() {
  const { accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [useRag, setUseRag] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
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

    const history = updatedMessages
      .filter((m) => m.role !== "assistant" || m.content.length > 0)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      if (useRag) {
        await runRagQuery(text, assistantId);
      } else {
        await streamChat(text, history, assistantId);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      // Optional: Add error handling UI here if needed
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
    const res = await fetch(CHAT_STREAM_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ prompt, history }),
    });

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
        if (!event.startsWith("data:")) continue;
        const payload = JSON.parse(event.replace("data: ", ""));
        handleStreamEvent(payload, assistantId);
      }
    }
  };

  // -------------------------
  // RAG QUERY (NON-STREAM)
  // -------------------------
  const runRagQuery = async (query: string, assistantId: string) => {
    const form = new FormData();
    form.append("query", query);

    const res = await fetch(RAG_QUERY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!res.ok) throw new Error("RAG Query Failed");

    const data = await res.json();

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              content: data.answer,
              sources: data.sources,
              streaming: false,
            }
          : m
      )
    );

    setStreaming(false);
  };

  // -------------------------
  // STREAM EVENT HANDLER
  // -------------------------
  const handleStreamEvent = (
    event: { type: string; value?: any },
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
           <span className="text-sm font-semibold text-zinc-600">Active Session</span>
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
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}