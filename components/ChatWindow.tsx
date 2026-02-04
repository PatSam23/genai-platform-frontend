"use client";

import { useState, useRef, useEffect } from "react";
import { Message } from "@/types/chat";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";

const STREAM_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/stream`;

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    // 1️⃣ Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    // 2️⃣ Pre-create assistant message
    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setStreaming(true);

    await streamResponse(text, assistantId);
  };

  const streamResponse = async (prompt: string, assistantId: string) => {
    const res = await fetch(STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
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

    if (event.type === "sources") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, sources: event.value } : m
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
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  );
}
