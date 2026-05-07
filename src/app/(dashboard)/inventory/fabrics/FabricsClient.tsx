"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Package, X, Search } from "lucide-react";
import {
  EditFabricButton,
  EditFabricCategoryButton,
  DeleteFabricCategoryButton,
} from "./FabricActions";

interface FabricCategory {
  id: string;
  name: string;
}

interface Fabric {
  id: string;
  categoryId: string | null;
  material: string;
  color: string;
  photoUrl: string | null;
  width: number | null;
  cuts: string | null;
  totalLength: any;
  yearBought: string | null;
  supplier: string | null;
  notes: string | null;
  articleNumber: string | null;
}

export function FabricsClient({
  fabrics,
  categories,
  canEdit,
  canManageCategories,
  currentCategoryId,
  searchQuery,
}: {
  fabrics: Fabric[];
  categories: FabricCategory[];
  canEdit: boolean;
  canManageCategories: boolean;
  currentCategoryId: string | undefined;
  searchQuery: string;
}) {
  const router = useRouter();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredFabrics = useMemo(() => {
    let items = currentCategoryId
      ? fabrics.filter((f) => f.categoryId === currentCategoryId)
      : fabrics;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) =>
          f.material.toLowerCase().includes(q) ||
          f.color?.toLowerCase().includes(q) ||
          f.supplier?.toLowerCase().includes(q) ||
          f.yearBought?.toLowerCase().includes(q) ||
          f.notes?.toLowerCase().includes(q) ||
          f.articleNumber?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [fabrics, currentCategoryId, search]);

  const selectCategory = (id: string | null) => {
    const params = new URLSearchParams();
    if (id) params.set("categoryId", id);
    router.push(`/inventory/fabrics${params.toString() ? "?" + params.toString() : ""}`);
  };

  return (
    <>
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

      <div className="flex gap-4 min-h-[400px]">
        {/* Category sidebar */}
        {categories.length > 0 && (
          <div className="w-52 shrink-0 border rounded-lg overflow-hidden self-start">
            <div className="p-2 bg-muted/30 border-b">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Категории
              </span>
            </div>
            <div className="divide-y text-sm">
              <button
                onClick={() => selectCategory(null)}
                className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2 ${
                  !currentCategoryId ? "bg-accent font-medium" : ""
                }`}
              >
                <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                Все
              </button>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`group flex items-center hover:bg-accent transition-colors ${
                    currentCategoryId === cat.id ? "bg-accent font-medium" : ""
                  }`}
                >
                  <button
                    onClick={() => selectCategory(cat.id)}
                    className="flex-1 text-left px-3 py-2 flex items-center gap-2 min-w-0"
                  >
                    <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </button>
                  {canManageCategories && (
                    <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100">
                      <EditFabricCategoryButton category={cat} />
                      <DeleteFabricCategoryButton category={cat} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по тканям..."
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <table className="text-sm" style={{ minWidth: "1000px", width: "100%" }}>
              <thead>
                <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-2 text-left" style={{ width: "80px" }}>Фото</th>
                  <th className="px-3 py-2 text-left">Материал</th>
                  <th className="px-3 py-2 text-left">Цвет</th>
                  <th className="px-3 py-2 text-right" style={{ width: "80px" }}>Ширина</th>
                  <th className="px-3 py-2 text-left">Отрезы</th>
                  <th className="px-3 py-2 text-right" style={{ width: "80px" }}>Длина (м)</th>
                  <th className="px-3 py-2 text-left" style={{ width: "100px" }}>Артикул</th>
                  <th className="px-3 py-2 text-left">Год закупа</th>
                  <th className="px-3 py-2 text-left">Поставщик</th>
                  <th className="px-3 py-2 text-left" style={{ minWidth: "140px" }}>Примечание</th>
                  {canEdit && <th className="px-3 py-2 text-right">Действия</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFabrics.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 11 : 10} className="px-3 py-6 text-center text-muted-foreground">
                      Данных нет
                    </td>
                  </tr>
                ) : (
                  filteredFabrics.map((fabric: Fabric) => (
                    <tr key={fabric.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-3 py-2">
                        {fabric.photoUrl ? (
                          <img
                            src={`/api/files/${fabric.photoUrl}`}
                            alt={fabric.material}
                            className="w-16 h-16 object-cover rounded-md border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxSrc(`/api/files/${fabric.photoUrl}`)}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md border bg-muted/30 flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{fabric.material}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border border-border shrink-0"
                            style={{ backgroundColor: fabric.color }}
                            title={fabric.color}
                          />
                          <span className="text-xs text-muted-foreground font-mono">{fabric.color}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {fabric.width ? `${fabric.width} см` : "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{fabric.cuts ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {fabric.totalLength ? Number(fabric.totalLength) : "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{fabric.articleNumber ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{fabric.yearBought ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{fabric.supplier ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-pre-wrap break-words" style={{ minWidth: "140px" }}>
                        {fabric.notes ?? "—"}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2 text-right">
                          <EditFabricButton
                            fabric={{
                              id: fabric.id,
                              categoryId: fabric.categoryId,
                              material: fabric.material,
                              color: fabric.color,
                              photoUrl: fabric.photoUrl,
                              width: fabric.width,
                              cuts: fabric.cuts,
                              totalLength: fabric.totalLength,
                              yearBought: fabric.yearBought,
                              supplier: fabric.supplier,
                              notes: fabric.notes,
                            }}
                            categories={categories}
                          />
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
