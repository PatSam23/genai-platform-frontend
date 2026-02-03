import { Message } from "@/types/chat";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`max-w-xl px-4 py-2 rounded-lg ${
        isUser
          ? "bg-blue-600 text-white self-end"
          : "bg-gray-200 text-black self-start"
      }`}
    >
      {message.content}
    </div>
  );
}
