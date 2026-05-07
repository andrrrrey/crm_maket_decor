"use client";

import { useState, useMemo } from "react";
import { Search, Package, ChevronRight, X } from "lucide-react";
import { EditItemButton, DamageButton, DeleteItemButton, DeleteCategoryButton, EditCategoryButton } from "./InventoryActions";

const STATUS_LABELS: Record<string, string> = {
  site: "Сайт",
  studio: "Студия",
  utyl: "Утиль",
  // legacy
  active: "Активен",
  in_use: "В использовании",
  damaged: "Повреждён",
};

const STATUS_COLORS: Record<string, string> = {
  site: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
  studio: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
  utyl: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
  active: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
  in_use: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400",
  damaged: "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
};

const LOCATION_LABELS: Record<string, string> = {
  studio: "Студия",
  warehouse: "Склад",
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
  location: string | null;
  articleNumber: string | null;
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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
          i.comment?.toLowerCase().includes(q) ||
          i.status?.toLowerCase().includes(q) ||
          (STATUS_LABELS[i.status] ?? "").toLowerCase().includes(q) ||
          i.location?.toLowerCase().includes(q) ||
          (LOCATION_LABELS[i.location ?? ""] ?? "").toLowerCase().includes(q) ||
          i.articleNumber?.toLowerCase().includes(q) ||
          i.quantity.toString().includes(q) ||
          i.totalDamages.toString().includes(q)
      );
    }

    return items;
  }, [selectedCategoryId, allItems, search, categories]);

  const topCategories = categories.filter((c) => c.parentId === null);

  return (
    <>
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="фото"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="flex gap-4 min-h-[500px]">
        {/* Left sidebar — wider category column */}
        <div className="w-64 shrink-0 border rounded-lg overflow-hidden self-start">
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
                <div
                  className={`group flex items-center hover:bg-accent transition-colors ${
                    selectedCategoryId === cat.id ? "bg-accent font-medium" : ""
                  }`}
                >
                  <button
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="flex-1 text-left px-3 py-2 flex items-center gap-2 min-w-0"
                  >
                    <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="break-words leading-tight">{cat.name}</span>
                  </button>
                  {canDelete && (
                    <div className="flex items-center pr-1 gap-0.5">
                      <EditCategoryButton category={cat} />
                      <DeleteCategoryButton category={cat} />
                    </div>
                  )}
                </div>
                {cat.children.map((sub) => (
                  <div
                    key={sub.id}
                    className={`group flex items-center hover:bg-accent transition-colors text-muted-foreground ${
                      selectedCategoryId === sub.id ? "bg-accent text-foreground font-medium" : ""
                    }`}
                  >
                    <button
                      onClick={() => setSelectedCategoryId(sub.id)}
                      className="flex-1 text-left pl-7 pr-3 py-1.5 flex items-center gap-2 min-w-0"
                    >
                      <ChevronRight className="h-3 w-3 shrink-0" />
                      <span className="break-words text-xs leading-tight">{sub.name}</span>
                    </button>
                    {canDelete && (
                      <div className="flex items-center pr-1 gap-0.5">
                        <EditCategoryButton category={sub} />
                        <DeleteCategoryButton category={sub} />
                      </div>
                    )}
                  </div>
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
            <table className="text-sm" style={{ minWidth: "1000px", width: "100%" }}>
              <thead>
                <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-2 text-left" style={{ width: "80px" }}>Фото</th>
                  <th className="px-3 py-2 text-left">Наименование</th>
                  <th className="px-3 py-2 text-right" style={{ width: "80px" }}>Количество</th>
                  <th className="px-3 py-2 text-left" style={{ width: "90px" }}>Артикул</th>
                  <th className="px-3 py-2 text-left" style={{ width: "90px" }}>Статус</th>
                  <th className="px-3 py-2 text-left" style={{ width: "80px" }}>Расп-е</th>
                  <th className="px-3 py-2 text-left" style={{ width: "80px" }}>Цвет</th>
                  <th className="px-3 py-2 text-right" style={{ width: "70px" }}>Потери</th>
                  <th className="px-3 py-2 text-left" style={{ minWidth: "200px" }}>Комментарий</th>
                  {(canEdit || canDelete) && <th className="px-3 py-2 text-right" style={{ width: "90px" }}>Действия</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit || canDelete ? 10 : 9} className="px-3 py-6 text-center text-muted-foreground">
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
                            className="w-16 h-16 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxSrc(`/api/files/${item.photoUrl}`)}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md border bg-muted/30 flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{item.name}</td>
                      <td className="px-3 py-2 text-right font-mono">{item.quantity}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.articleNumber ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                            STATUS_COLORS[item.status] ?? STATUS_COLORS.site
                          }`}
                        >
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {item.location ? LOCATION_LABELS[item.location] ?? item.location : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{item.color ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {item.totalDamages > 0 ? (
                          <span className="text-red-500 font-mono">{item.totalDamages}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-pre-wrap break-words" style={{ minWidth: "200px", maxWidth: "300px" }}>
                        {item.comment ?? "—"}
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            {canEdit && (
                              <>
                                <EditItemButton item={item} categories={categories} />
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
    </>
  );
}
