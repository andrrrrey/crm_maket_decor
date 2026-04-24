"use client";

import { useState, useMemo } from "react";
import { Search, Package, ChevronRight } from "lucide-react";
import { EditItemButton, DamageButton, DeleteItemButton } from "./InventoryActions";

const STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  in_use: "В использовании",
  damaged: "Повреждён",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
  in_use: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400",
  damaged: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
};

interface Item {
  id: string;
  name: string;
  color: string | null;
  quantity: number;
  photoUrl: string | null;
  status: string;
  comment: string | null;
  totalDamages: number;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: { id: string; name: string }[];
  items: Item[];
}

export function InventoryClient({
  categories,
  canEdit,
  canDelete,
}: {
  categories: Category[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const allItems = useMemo(() => {
    const items: Item[] = [];
    for (const cat of categories) {
      items.push(...cat.items);
      for (const sub of cat.children) {
        const subCat = categories.find((c) => c.id === sub.id);
        if (subCat) items.push(...subCat.items);
      }
    }
    return items;
  }, [categories]);

  const filteredItems = useMemo(() => {
    let items: Item[];
    if (selectedCategoryId) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      if (cat) {
        items = [...cat.items];
        for (const sub of cat.children) {
          const subCat = categories.find((c) => c.id === sub.id);
          if (subCat) items.push(...subCat.items);
        }
      } else {
        // subcategory selected
        items = allItems.filter((i) => i.categoryId === selectedCategoryId);
      }
    } else {
      items = allItems;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.color?.toLowerCase().includes(q) ||
          i.comment?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [selectedCategoryId, allItems, search, categories]);

  const topCategories = categories.filter((c) => c.parentId === null);

  return (
    <div className="flex gap-4 min-h-[500px]">
      {/* Left sidebar */}
      <div className="w-52 shrink-0 border rounded-lg overflow-hidden self-start">
        <div className="p-2 bg-muted/30 border-b">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Категории
          </span>
        </div>
        <div className="divide-y text-sm">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 ${
              selectedCategoryId === null ? "bg-accent font-medium" : ""
            }`}
          >
            <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            Все
          </button>
          {topCategories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 ${
                  selectedCategoryId === cat.id ? "bg-accent font-medium" : ""
                }`}
              >
                <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{cat.name}</span>
              </button>
              {cat.children.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedCategoryId(sub.id)}
                  className={`w-full text-left pl-7 pr-3 py-1.5 hover:bg-accent transition-colors flex items-center gap-2 text-muted-foreground ${
                    selectedCategoryId === sub.id
                      ? "bg-accent text-foreground font-medium"
                      : ""
                  }`}
                >
                  <ChevronRight className="h-3 w-3 shrink-0" />
                  <span className="truncate text-xs">{sub.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по инвентарю..."
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
          />
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-3 py-2 text-left w-12">Фото</th>
                <th className="px-3 py-2 text-left">Наименование</th>
                <th className="px-3 py-2 text-left">Статус</th>
                <th className="px-3 py-2 text-right">Кол-во</th>
                <th className="px-3 py-2 text-left">Цвет</th>
                <th className="px-3 py-2 text-right">Потери</th>
                <th className="px-3 py-2 text-left max-w-[160px]">Комментарий</th>
                {(canEdit || canDelete) && <th className="px-3 py-2 text-right">Действия</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={canEdit || canDelete ? 8 : 7} className="px-3 py-6 text-center text-muted-foreground">
                    {search ? "Ничего не найдено" : "Нет позиций"}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-3 py-2">
                      {item.photoUrl ? (
                        <img
                          src={`/api/files/${item.photoUrl}`}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{item.name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[item.status] ?? STATUS_COLORS.active
                        }`}
                      >
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{item.quantity}</td>
                    <td className="px-3 py-2 text-muted-foreground">{item.color ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {item.totalDamages > 0 ? (
                        <span className="text-red-500 font-mono">{item.totalDamages}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-[160px] truncate text-muted-foreground" title={item.comment ?? ""}>
                      {item.comment ?? "—"}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 justify-end">
                          {canEdit && (
                            <>
                              <EditItemButton item={item} />
                              <DamageButton item={item} />
                            </>
                          )}
                          {canDelete && <DeleteItemButton item={item} />}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
