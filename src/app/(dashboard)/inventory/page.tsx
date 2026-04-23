import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import {
  AddCategoryButton,
  AddItemButton,
  EditItemButton,
  DamageButton,
  DeleteItemButton,
  InventorySearch,
} from "./InventoryActions";

async function getCategories() {
  return prisma.inventoryCategory.findMany({
    include: {
      children: {
        include: {
          _count: { select: { items: true } },
          items: {
            orderBy: { name: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { items: true } },
      items: {
        orderBy: { name: "asc" },
      },
    },
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
  });
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();
  const user = session?.user as any;

  const canEdit = user.role === "DIRECTOR" || user.role === "PRODUCTION";
  const canDelete = user.role === "DIRECTOR";

  const categories = await getCategories();
  const totalItems = await prisma.inventoryItem.count();

  // Search
  const searchQuery = searchParams.q?.trim();
  let searchResults: any[] | null = null;
  if (searchQuery) {
    searchResults = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { color: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      include: { category: true },
      orderBy: { name: "asc" },
      take: 50,
    });
  }

  // Flatten categories for buttons
  const flatCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    children: c.children.map((ch) => ({ id: ch.id, name: ch.name })),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Инвентарь</h1>
          <p className="text-sm text-muted-foreground">
            {totalItems} позиций
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InventorySearch />
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

      {/* Search results */}
      {searchResults !== null && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">
            Результаты поиска: {searchResults.length}
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ничего не найдено</p>
          ) : (
            <div className="border rounded-lg divide-y">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2 flex items-center justify-between text-sm"
                >
                  <div>
                    <span>{item.name}</span>
                    {item.color && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {item.color}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.category.name})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {item.quantity} шт.
                    </span>
                    {canEdit && (
                      <>
                        <EditItemButton item={item} />
                        <DamageButton item={item} />
                        {canDelete && <DeleteItemButton item={item} />}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories tree */}
      {!searchResults && (
        <>
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

                  {/* Subcategories */}
                  {cat.children.length > 0 && (
                    <div className="divide-y">
                      {cat.children.map((sub) => (
                        <div key={sub.id}>
                          <div className="px-4 py-2 flex items-center justify-between text-sm bg-muted/10">
                            <div className="flex items-center gap-2 font-medium">
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              {sub.name}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {sub._count.items}
                            </span>
                          </div>
                          {sub.items.length > 0 && (
                            <div className="divide-y">
                              {sub.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="px-6 py-2 flex items-center justify-between text-sm"
                                >
                                  <span>
                                    {item.name}
                                    {item.color && (
                                      <span className="text-muted-foreground">
                                        {" "}
                                        · {item.color}
                                      </span>
                                    )}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">
                                      {item.quantity} шт.
                                    </span>
                                    {canEdit && (
                                      <>
                                        <EditItemButton item={item} />
                                        <DamageButton item={item} />
                                        {canDelete && <DeleteItemButton item={item} />}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Items in root category */}
                  {cat.children.length === 0 && cat.items.length > 0 && (
                    <div className="divide-y">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className="px-4 py-2 flex items-center justify-between text-sm"
                        >
                          <span>
                            {item.name}
                            {item.color && (
                              <span className="text-muted-foreground">
                                {" "}
                                · {item.color}
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {item.quantity} шт.
                            </span>
                            {canEdit && (
                              <>
                                <EditItemButton item={item} />
                                <DamageButton item={item} />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
