"use client";

import { useRouter } from "next/navigation";
import { CheckCheck, UserPlus } from "lucide-react";

export function MailActions({
  entryId,
  isRead,
  fromEmail,
  subject,
}: {
  entryId: string;
  isRead: boolean;
  fromEmail: string;
  subject: string;
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

  const createClient = () => {
    const params = new URLSearchParams();
    params.set("from", "mail");
    params.set("mailId", entryId);
    if (fromEmail) {
      params.set("email", fromEmail);
      params.set("clientName", fromEmail.split("@")[0]);
    }
    if (subject) params.set("projectIdea", subject);
    router.push(`/clients/new?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={createClient}
        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        title="Создать клиента"
      >
        <UserPlus className="h-4 w-4" />
      </button>
      {!isRead && (
        <button
          onClick={markAsRead}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Отметить как прочитанное"
        >
          <CheckCheck className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
