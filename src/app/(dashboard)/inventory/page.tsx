export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AddCategoryButton, AddItemButton } from "./InventoryActions";
import { InventoryClient } from "./InventoryClient";

async function getCategoriesWithItems() {
  const categories = await prisma.inventoryCategory.findMany({
    include: {
      children: {
        select: { id: true, name: true },
        orderBy: { sortOrder: "asc" },
      },
      items: {
        include: {
          damages: { select: { quantity: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    parentId: cat.parentId,
    children: cat.children,
    items: cat.items.map((item) => ({
      id: item.id,
      name: item.name,
      color: item.color,
      quantity: item.quantity,
      photoUrl: item.photoUrl,
      status: item.status,
      comment: item.comment,
      categoryId: item.categoryId,
      totalDamages: item.damages.reduce((sum, d) => sum + d.quantity, 0),
    })),
  }));
}

export default async function InventoryPage() {
  const session = await auth();
  const user = session?.user as any;

  const canEdit = user.role === "DIRECTOR" || user.role === "PRODUCTION";
  const canDelete = user.role === "DIRECTOR";

  const categories = await getCategoriesWithItems();

  const flatCategories = categories
    .filter((c) => c.parentId === null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      children: c.children,
    }));

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Инвентарь</h1>
          <p className="text-sm text-muted-foreground">{totalItems} позиций</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/inventory/fabrics"
            className="px-4 py-2 border rounded-md text-sm hover:bg-accent transition-colors"
          >
            Ткани
          </Link>
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <AddCategoryButton categories={flatCategories} />
          <AddItemButton categories={flatCategories} />
        </div>
      )}

      <InventoryClient
        categories={categories}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
