"use client";

import { useState } from "react";

export default function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="p-6 bg-white border-t border-zinc-300">
      <div className="max-w-4xl mx-auto flex gap-4">
        <input
          className="flex-1 bg-zinc-50 border border-zinc-300 rounded-xl px-5 py-4 text-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent transition-all shadow-sm"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={disabled}
        />
        <button
          className="bg-zinc-900 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-black hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:transform-none"
          onClick={handleSend}
          disabled={disabled}
        >
          Send
        </button>
      </div>
    </div>
  );
}