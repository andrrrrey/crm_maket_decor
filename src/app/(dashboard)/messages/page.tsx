export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default async function MessagesPage() {
  const session = await auth();
  const user = session?.user as any;

  const messages = await prisma.message.findMany({
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold">Сообщения</h1>
        <p className="text-sm text-muted-foreground">Общий чат команды</p>
      </div>

      <div className="flex-1 overflow-hidden border rounded-lg bg-card p-4">
        <ChatWindow
          initialMessages={messages.map((m) => ({
            ...m,
            createdAt: m.createdAt.toISOString(),
          }))}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
