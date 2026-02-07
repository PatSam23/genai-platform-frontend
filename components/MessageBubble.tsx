import { Message } from "@/types/chat";
import clsx from "clsx";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={clsx(
        "max-w-xl px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
        isUser
          ? "bg-primary text-primary-foreground self-end rounded-br-sm"
          : "bg-card text-card-foreground border border-border self-start rounded-bl-sm"
      )}
    >
      <div className={clsx("font-semibold text-lg mb-1", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
        {isUser ? "You" : "AI Assistant"}
      </div>
      {message.content}
      {message.streaming && (
        <span className="ml-2 inline-block w-2 h-4 bg-current opacity-70 animate-pulse rounded-sm" />
      )}
      
      {/* Optional: Style sources if they exist */}
      {message.sources && message.sources.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground/80">
            <p className="font-medium mb-1">Sources:</p>
            <ul className="list-disc pl-4 space-y-1">
                {message.sources.map((source, idx) => (
                    <li key={idx}>{source.metadata?.source || JSON.stringify(source).slice(0, 50) + "..."}</li>
                 ))}
            </ul>
        </div>
      )}
    </div>
  );
}