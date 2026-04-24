export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddFabricButton, EditFabricButton } from "./FabricActions";
import { FabricSearch } from "./FabricSearch";

export default async function FabricsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await auth();
  const user = session?.user as any;
  const canEdit = user.role === "DIRECTOR" || user.role === "PRODUCTION";

  const search = searchParams.q?.trim();

  const fabrics = await prisma.fabric.findMany({
    where: search
      ? {
          OR: [
            { material: { contains: search, mode: "insensitive" } },
            { color: { contains: search, mode: "insensitive" } },
            { supplier: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ material: "asc" }, { color: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/inventory" className="p-2 rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Ткани</h1>
        <div className="ml-auto flex items-center gap-2">
          <FabricSearch initialQuery={search ?? ""} />
          {canEdit && <AddFabricButton />}
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Материал</th>
              <th className="px-3 py-2 text-left">Цвет</th>
              <th className="px-3 py-2 text-right">Ширина</th>
              <th className="px-3 py-2 text-left">Отрезы</th>
              <th className="px-3 py-2 text-right">Длина (м)</th>
              <th className="px-3 py-2 text-left">Год закупа</th>
              <th className="px-3 py-2 text-left">Поставщик</th>
              <th className="px-3 py-2 text-left max-w-[160px]">Примечание</th>
              {canEdit && <th className="px-3 py-2 text-right">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {fabrics.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 9 : 8} className="px-3 py-6 text-center text-muted-foreground">
                  {search ? "Ничего не найдено" : "Данных нет"}
                </td>
              </tr>
            ) : (
              fabrics.map((fabric) => (
                <tr key={fabric.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-3 py-2 font-medium">{fabric.material}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-border shrink-0"
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
                  <td className="px-3 py-2 text-muted-foreground">{fabric.yearBought ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fabric.supplier ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[160px] truncate text-muted-foreground" title={fabric.notes ?? ""}>
                    {fabric.notes ?? "—"}
                  </td>
                  {canEdit && (
                    <td className="px-3 py-2 text-right">
                      <EditFabricButton
                        fabric={{
                          id: fabric.id,
                          material: fabric.material,
                          color: fabric.color,
                          width: fabric.width,
                          cuts: fabric.cuts,
                          totalLength: fabric.totalLength,
                          yearBought: fabric.yearBought,
                          supplier: fabric.supplier,
                          notes: fabric.notes,
                        }}
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
  );
}
