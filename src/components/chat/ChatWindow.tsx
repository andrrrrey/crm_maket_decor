"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/types";

interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role: string;
  };
}

interface ChatWindowProps {
  initialMessages: ChatMessage[];
  currentUserId: string;
}

export function ChatWindow({ initialMessages, currentUserId }: ChatWindowProps) {
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
    socket.emit("general:join");

    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("general:message", handleMessage);
    return () => {
      socket.off("general:message", handleMessage);
    };
  }, [socket]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Нет сообщений. Начните общение!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn("flex gap-2", isOwn && "flex-row-reverse")}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 self-end">
                  {msg.user.name.charAt(0)}
                </div>
                <div className={cn("max-w-[70%]", isOwn && "items-end")}>
                  {!isOwn && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium">{msg.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ROLE_LABELS[msg.user.role as Role]}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    )}
                  >
                    <p>{msg.text}</p>
                    <p className={cn("text-xs mt-1 opacity-60", isOwn ? "text-right" : "")}>
                      {format(new Date(msg.createdAt), "HH:mm", { locale: ru })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 shrink-0">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Написать сообщение..."
          className="flex-1 text-sm px-4 py-2 border rounded-full bg-background focus:ring-1 focus:ring-ring outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
