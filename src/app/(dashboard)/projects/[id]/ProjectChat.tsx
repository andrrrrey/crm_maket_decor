"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

interface ProjectChatProps {
  projectId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
}

export function ProjectChat({
  projectId,
  initialMessages,
  currentUserId,
}: ProjectChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socket = useSocket(currentUserId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("project:join", projectId);

    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("project:message", handleMessage);
    return () => {
      socket.off("project:message", handleMessage);
      socket.emit("project:leave", projectId);
    };
  }, [socket, projectId]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch(`/api/projects/${projectId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    setText("");
    setSending(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Сообщения */}
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Нет сообщений
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isOwn && "flex-row-reverse"
                )}
              >
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                  {msg.user.name.charAt(0)}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {!isOwn && (
                    <p className="text-xs font-medium mb-0.5 opacity-70">
                      {msg.user.name}
                    </p>
                  )}
                  <p>{msg.text}</p>
                  <p className={cn("text-xs mt-1 opacity-60", isOwn ? "text-right" : "")}>
                    {format(new Date(msg.createdAt), "HH:mm", { locale: ru })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Написать сообщение..."
          className="flex-1 text-sm px-3 py-2 border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
