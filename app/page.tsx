"use client";

import { useState, useCallback } from "react";
import ChatWindow from "@/components/ChatWindow";
import ChatSidebar from "@/components/chat/ChatSidebar";

export default function Home() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const handleSessionCreated = useCallback((sessionId: string) => {
    // A new session was created by the backend during streaming — update sidebar
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
    setSidebarRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="h-full w-full flex">
      <ChatSidebar
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        refreshKey={sidebarRefreshKey}
      />
      <div className="flex-1 h-full">
        <ChatWindow
          activeSessionId={activeSessionId}
          onSessionCreated={handleSessionCreated}
        />
      </div>
    </div>
  );
}