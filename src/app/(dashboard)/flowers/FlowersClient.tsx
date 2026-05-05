"use client";

import { useState, useMemo } from "react";
import { Search, Flower2, ChevronRight, X } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ru } from "date-fns/locale";
import { AddFlowerButton, EditFlowerButton, DeleteFlowerButton, DeleteFlowerCategoryButton } from "./FlowersActions";

function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  const d = parseISO(val);
  if (isValid(d)) return format(d, "dd.MM.yyyy", { locale: ru });
  return val;
}

interface FlowerCategory {
  id: string;
  name: string;
}

interface Flower {
  id: string;
  categoryId: string | null;
  name: string;
  material: string | null;
  height: number | null;
  purchaseDate: string | null;
  quantity: number;
  pricePerUnit: string | null;
  photoUrl: string | null;
}

interface FlowersClientProps {
  categories: FlowerCategory[];
  flowers: Flower[];
  canEdit: boolean;
  canDelete: boolean;
}

export function FlowersClient({ categories, flowers, canEdit, canDelete }: FlowersClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = selectedCategoryId
      ? flowers.filter((f) => f.categoryId === selectedCategoryId)
      : flowers;

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.material?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [flowers, selectedCategoryId, search]);

  let rowIndex = 0;

  return (
    <>
      {lightboxSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxSrc(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white" onClick={() => setLightboxSrc(null)}>
            <X className="h-5 w-5" />
          </button>
          <img src={lightboxSrc} alt="фото" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="flex gap-4 min-h-[400px]">
        {/* Sidebar categories */}
        <div className="w-52 shrink-0 border rounded-lg overflow-hidden self-start">
          <div className="p-2 bg-muted/30 border-b">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Категории</span>
          </div>
          <div className="divide-y text-sm">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 ${selectedCategoryId === null ? "bg-accent font-medium" : ""}`}
            >
              <Flower2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              Все
            </button>
            {categories.map((cat) => (
              <div key={cat.id} className={`group flex items-center hover:bg-accent transition-colors ${selectedCategoryId === cat.id ? "bg-accent font-medium" : ""}`}>
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="flex-1 text-left px-3 py-2 flex items-center gap-2 min-w-0"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{cat.name}</span>
                </button>
                {canDelete && <DeleteFlowerCategoryButton category={cat} />}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по цветам..."
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="text-sm" style={{ minWidth: "900px", width: "100%" }}>
              <thead>
                <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-2 text-right" style={{ width: "50px" }}>№</th>
                  <th className="px-3 py-2 text-left" style={{ width: "80px" }}>Фото</th>
                  <th className="px-3 py-2 text-left">Название</th>
                  <th className="px-3 py-2 text-left" style={{ width: "120px" }}>Материал</th>
                  <th className="px-3 py-2 text-right" style={{ width: "80px" }}>Высота</th>
                  <th className="px-3 py-2 text-left" style={{ width: "110px" }}>Дата покупки</th>
                  <th className="px-3 py-2 text-right" style={{ width: "80px" }}>Кол-во</th>
                  <th className="px-3 py-2 text-right" style={{ width: "100px" }}>Цена за шт</th>
                  <th className="px-3 py-2 text-right" style={{ width: "110px" }}>Итого</th>
                  {(canEdit || canDelete) && <th className="px-3 py-2 text-right" style={{ width: "80px" }}>Действия</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit || canDelete ? 10 : 9} className="px-3 py-6 text-center text-muted-foreground">
                      {search ? "Ничего не найдено" : "Нет позиций"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((flower) => {
                    rowIndex++;
                    const price = flower.pricePerUnit ? Number(flower.pricePerUnit) : null;
                    const total = price !== null ? price * flower.quantity : null;
                    return (
                      <tr key={flower.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-3 py-2 text-right text-muted-foreground font-mono text-xs">{rowIndex}</td>
                        <td className="px-3 py-2">
                          {flower.photoUrl ? (
                            <img
                              src={`/api/files/${flower.photoUrl}`}
                              alt={flower.name}
                              className="w-14 h-14 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setLightboxSrc(`/api/files/${flower.photoUrl}`)}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-md border bg-muted/30 flex items-center justify-center">
                              <Flower2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">{flower.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{flower.material ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{flower.height ? `${flower.height} см` : "—"}</td>
                        <td className="px-3 py-2">{formatDate(flower.purchaseDate)}</td>
                        <td className="px-3 py-2 text-right font-mono">{flower.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          {price !== null ? `${price.toLocaleString("ru-RU")} ₽` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {total !== null ? `${total.toLocaleString("ru-RU")} ₽` : "—"}
                        </td>
                        {(canEdit || canDelete) && (
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 justify-end">
                              {canEdit && <EditFlowerButton flower={flower} categories={categories} />}
                              {canDelete && <DeleteFlowerButton flower={flower} />}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
