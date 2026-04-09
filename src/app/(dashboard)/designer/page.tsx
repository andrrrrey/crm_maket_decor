import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { Plus, Star } from "lucide-react";

export default async function DesignerPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const where: any = {};
  if (user.role === "DESIGNER") {
    where.designerId = user.id;
  }
  if (searchParams.month) {
    where.month = searchParams.month;
  }

  const mockups = await prisma.mockup.findMany({
    where,
    include: {
      designer: { select: { id: true, name: true } },
      images: { take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Макеты дизайнера</h1>
        {(user.role === "DIRECTOR" || user.role === "DESIGNER") && (
          <Link
            href="/designer/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Новый макет
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockups.length === 0 ? (
          <p className="text-muted-foreground col-span-3">Макетов нет</p>
        ) : (
          mockups.map((mockup) => (
            <Link
              href={`/designer/${mockup.id}`}
              key={mockup.id}
              className="p-4 rounded-lg border bg-card space-y-2 hover:border-primary/50 transition-colors block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  #{mockup.number}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    mockup.status === "closed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {mockup.status === "closed" ? "Закрыт" : "В работе"}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Начало: </span>
                  {format(new Date(mockup.startDate), "dd.MM.yyyy", { locale: ru })}
                </div>
                {mockup.installDate && (
                  <div>
                    <span className="text-muted-foreground">Монтаж: </span>
                    {format(new Date(mockup.installDate), "dd.MM.yyyy", { locale: ru })}
                  </div>
                )}
                {mockup.daysToComplete && (
                  <div>
                    <span className="text-muted-foreground">Дней: </span>
                    {mockup.daysToComplete}
                  </div>
                )}
              </div>

              {mockup.complexity && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < mockup.complexity!
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              )}

              {mockup.images.length > 0 && (
                <div className="rounded-md overflow-hidden h-24">
                  <img
                    src={`/api/files/${mockup.images[0].filePath}`}
                    alt="Макет"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {mockup.designer.name} · {mockup.month}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
