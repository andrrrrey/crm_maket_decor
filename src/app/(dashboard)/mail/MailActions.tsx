"use client";

import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

export function MailActions({
  entryId,
  isRead,
}: {
  entryId: string;
  isRead: boolean;
}) {
  const router = useRouter();

  const markAsRead = async () => {
    await fetch("/api/mail", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entryId, isRead: true }),
    });
    router.refresh();
  };

  if (isRead) return null;

  return (
    <button
      onClick={markAsRead}
      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
      title="Отметить как прочитанное"
    >
      <CheckCheck className="h-4 w-4" />
    </button>
  );
}
