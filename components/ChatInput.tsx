"use client";

import { useState, useRef } from "react";
import { Paperclip, X } from "lucide-react";

const ALLOWED_EXTENSIONS = [
  ".pdf", ".txt", ".md", ".csv", ".json",
  ".py", ".js", ".ts", ".html", ".css", ".log",
];

export default function ChatInput({
  onSend,
  disabled,
  isStreaming,
  onStop,
}: {
  onSend: (text: string, file?: File) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = () => {
    if (!text.trim() && !file) return;
    onSend(text, file || undefined);
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const ext = "." + selected.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      alert(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      e.target.value = "";
      return;
    }
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-6 bg-white border-t border-zinc-300">
      {/* File preview chip */}
      {file && (
        <div className="max-w-4xl mx-auto mb-3">
          <div className="inline-flex items-center gap-2 bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-1.5 text-sm text-zinc-700">
            <Paperclip className="w-3.5 h-3.5" />
            <span className="truncate max-w-[200px]">{file.name}</span>
            <span className="text-xs text-zinc-400">
              ({(file.size / 1024).toFixed(0)} KB)
            </span>
            <button
              onClick={removeFile}
              className="ml-1 hover:text-red-500 transition-colors"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex gap-3 items-end">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          disabled={disabled}
        />

        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-4 rounded-xl border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-all disabled:opacity-50 shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text input */}
        <input
          className="flex-1 bg-zinc-50 border border-zinc-300 rounded-xl px-5 py-4 text-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent transition-all shadow-sm"
          placeholder={file ? "Add a message about this file..." : "Type your message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !disabled && handleSend()}
          disabled={disabled}
        />

        {isStreaming ? (
          <button
            className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-red-700 hover:scale-105 transition-all shadow-md flex items-center gap-2"
            onClick={onStop}
            type="button"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop
          </button>
        ) : (
          <button
            className="bg-zinc-900 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-black hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:transform-none"
            onClick={handleSend}
            disabled={disabled || (!text.trim() && !file)}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}