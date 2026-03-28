import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";

async function getCategories() {
  return prisma.inventoryCategory.findMany({
    include: {
      children: {
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { items: true } },
      items: {
        take: 5,
        orderBy: { name: "asc" },
      },
    },
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });
}

export default async function InventoryPage() {
  const session = await auth();
  const user = session?.user as any;

  const categories = await getCategories();

  const totalItems = await prisma.inventoryItem.count();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Инвентарь</h1>
          <p className="text-sm text-muted-foreground">
            {totalItems} позиций
          </p>
        </div>
        <Link
          href="/inventory/fabrics"
          className="px-4 py-2 border rounded-md text-sm hover:bg-accent transition-colors"
        >
          Ткани
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">Категории не созданы</p>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-muted/30 font-medium text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                {cat.name}
                <span className="text-xs text-muted-foreground ml-auto">
                  {cat._count.items} позиций
                </span>
              </div>

              {/* Подкатегории */}
              {cat.children.length > 0 && (
                <div className="divide-y">
                  {cat.children.map((sub) => (
                    <div key={sub.id} className="px-4 py-2 flex items-center justify-between text-sm hover:bg-muted/20">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        {sub.name}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {sub._count.items}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Элементы без подкатегорий */}
              {cat.children.length === 0 && cat.items.length > 0 && (
                <div className="divide-y">
                  {cat.items.map((item) => (
                    <div key={item.id} className="px-4 py-2 flex items-center justify-between text-sm">
                      <span>
                        {item.name}
                        {item.color && (
                          <span className="text-muted-foreground"> · {item.color}</span>
                        )}
                      </span>
                      <span className="font-mono text-sm">
                        {item.quantity} шт.
                      </span>
                    </div>
                  ))}
                  {cat._count.items > 5 && (
                    <div className="px-4 py-2 text-xs text-muted-foreground">
                      И ещё {cat._count.items - 5}...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
