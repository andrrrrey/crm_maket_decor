import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Mail, MailOpen } from "lucide-react";
import { MailActions } from "./MailActions";

export default async function MailPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!canAccess(user.role, "mail")) {
    notFound();
  }

  const entries = await prisma.mailEntry.findMany({
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  const unreadCount = entries.filter((e) => !e.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Входящие заявки</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} непрочитанных`
              : "Все прочитаны"}
          </p>
        </div>
      </div>

      <div className="border rounded-lg divide-y">
        {entries.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Нет входящих заявок
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 flex items-start gap-3 ${
                !entry.isRead ? "bg-primary/5" : ""
              }`}
            >
              {entry.isRead ? (
                <MailOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              ) : (
                <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${!entry.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                    {entry.subject}
                  </p>
                  <time className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(entry.receivedAt), "dd.MM.yyyy HH:mm", { locale: ru })}
                  </time>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.fromEmail}
                </p>
                <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                  {entry.body}
                </p>
              </div>
              <MailActions
                entryId={entry.id}
                isRead={entry.isRead}
                fromEmail={entry.fromEmail}
                fromName={entry.fromName}
                subject={entry.subject}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
