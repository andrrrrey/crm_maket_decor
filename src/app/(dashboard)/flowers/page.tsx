export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FlowersClient } from "./FlowersClient";
import { AddFlowerButton, AddFlowerCategoryButton } from "./FlowersActions";

export default async function FlowersPage() {
  const session = await auth();
  const user = session?.user as any;

  const canEdit = user.role === "DIRECTOR" || user.role === "PRODUCTION";
  const canDelete = user.role === "DIRECTOR";

  const [categories, flowers] = await Promise.all([
    prisma.flowerCategory.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.flower.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalQuantity = flowers.reduce((sum, f) => sum + f.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Цветы</h1>
          <p className="text-sm text-muted-foreground">
            {flowers.length} позиций · {totalQuantity} шт
          </p>
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-2">
          {canDelete && <AddFlowerCategoryButton />}
          <AddFlowerButton
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      )}

      <FlowersClient
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        flowers={flowers.map((f) => ({
          id: f.id,
          categoryId: f.categoryId,
          name: f.name,
          material: f.material,
          height: f.height,
          purchaseDate: f.purchaseDate?.toISOString() ?? null,
          quantity: f.quantity,
          pricePerUnit: f.pricePerUnit?.toString() ?? null,
          photoUrl: f.photoUrl,
        }))}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
