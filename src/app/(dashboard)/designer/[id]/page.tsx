import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import {
  MockupStatusSelect,
  MockupEditForm,
  MockupImageUpload,
  MockupImageDelete,
  MockupDeleteButton,
} from "./MockupActions";

const STATUS_LABELS: Record<string, string> = {
  drawing: "В работе",
  pending_approval: "На согласовании",
  approved: "Согласован",
  transferred: "Передан",
  closed: "Закрыт",
};

const STATUS_COLORS: Record<string, string> = {
  drawing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  transferred: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const ZONE_LABELS: Record<string, string> = {
  ceremony: "Церемония",
  presidium: "Президиум",
  banquet: "Банкетный зал",
  photozone: "Фотозона",
  entrance: "Вход",
  other: "Другое",
};

export default async function MockupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const mockup = await prisma.mockup.findUnique({
    where: { id: params.id },
    include: {
      designer: { select: { id: true, name: true } },
      images: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!mockup) notFound();

  if (user.role === "DESIGNER" && mockup.designerId !== user.id) {
    notFound();
  }

  const canEdit =
    user.role === "DIRECTOR" ||
    user.role === "DESIGNER" ||
    user.role === "MANAGER";

  // Group images by zone
  const imagesByZone: Record<string, typeof mockup.images> = {};
  for (const img of mockup.images) {
    if (!imagesByZone[img.zone]) imagesByZone[img.zone] = [];
    imagesByZone[img.zone].push(img);
  }

  const mockupData = {
    id: mockup.id,
    status: mockup.status,
    startDate: mockup.startDate.toISOString(),
    installDate: mockup.installDate?.toISOString() ?? null,
    daysToComplete: mockup.daysToComplete,
    complexity: mockup.complexity,
    notes: mockup.notes,
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/designer"
          className="p-2 rounded-md hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Макет #{mockup.number}</h1>
            {canEdit ? (
              <MockupStatusSelect mockup={mockupData} />
            ) : (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  STATUS_COLORS[mockup.status] ?? STATUS_COLORS.drawing
                }`}
              >
                {STATUS_LABELS[mockup.status] ?? mockup.status}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Дизайнер: {mockup.designer.name} · {mockup.month}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1">
            <MockupDeleteButton
              mockupId={mockup.id}
              designerId={mockup.designerId}
              userId={user.id}
              userRole={user.role}
            />
            <MockupEditForm mockup={mockupData} />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border bg-card space-y-3">
          <h2 className="text-sm font-semibold">Детали макета</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Дата начала</dt>
              <dd>
                {format(new Date(mockup.startDate), "dd.MM.yyyy", {
                  locale: ru,
                })}
              </dd>
            </div>
            {mockup.installDate && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Дата монтажа</dt>
                <dd>
                  {format(new Date(mockup.installDate), "dd.MM.yyyy", {
                    locale: ru,
                  })}
                </dd>
              </div>
            )}
            {mockup.daysToComplete && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Дней на выполнение</dt>
                <dd>{mockup.daysToComplete}</dd>
              </div>
            )}
            {mockup.complexity && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Сложность</dt>
                <dd className="flex items-center gap-0.5">
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
                </dd>
              </div>
            )}
          </dl>
        </div>

        {mockup.notes && (
          <div className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-2">Примечания</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {mockup.notes}
            </p>
          </div>
        )}
      </div>

      {/* Upload button */}
      {canEdit && <MockupImageUpload mockupId={mockup.id} />}

      {/* Images by zone */}
      {Object.keys(ZONE_LABELS).map((zoneKey) => {
        const images = imagesByZone[zoneKey];
        if (!images || images.length === 0) return null;

        return (
          <div key={zoneKey} className="p-4 rounded-lg border bg-card">
            <h2 className="text-sm font-semibold mb-3">
              {ZONE_LABELS[zoneKey]}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <a
                    href={`/api/files/${img.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-md overflow-hidden border hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={`/api/files/${img.filePath}`}
                      alt={img.fileName}
                      className="w-full h-full object-cover"
                    />
                  </a>
                  {canEdit && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MockupImageDelete
                        mockupId={mockup.id}
                        imageId={img.id}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {mockup.images.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Изображения ещё не загружены
        </p>
      )}
    </div>
  );
}
