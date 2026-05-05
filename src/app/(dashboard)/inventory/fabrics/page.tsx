export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Package, X } from "lucide-react";
import {
  AddFabricButton,
  EditFabricButton,
  AddFabricCategoryButton,
  EditFabricCategoryButton,
  DeleteFabricCategoryButton,
} from "./FabricActions";
import { FabricSearch } from "./FabricSearch";
import { FabricsClient } from "./FabricsClient";

export default async function FabricsPage({
  searchParams,
}: {
  searchParams: { q?: string; categoryId?: string };
}) {
  const session = await auth();
  const user = session?.user as any;
  const canEdit = user.role === "DIRECTOR" || user.role === "PRODUCTION";
  const canManageCategories = user.role === "DIRECTOR";

  const search = searchParams.q?.trim();
  const categoryId = searchParams.categoryId;

  const [fabrics, categories] = await Promise.all([
    (prisma as any).fabric.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { material: { contains: search, mode: "insensitive" } },
                { color: { contains: search, mode: "insensitive" } },
                { supplier: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ material: "asc" }, { color: "asc" }],
    }),
    (prisma as any).fabricCategory.findMany({
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ткани</h1>
          <p className="text-sm text-muted-foreground">{fabrics.length} позиций</p>
        </div>
        <div className="flex items-center gap-2">
          <FabricSearch initialQuery={search ?? ""} />
          {canManageCategories && <AddFabricCategoryButton />}
          {canEdit && <AddFabricButton categories={categories} />}
        </div>
      </div>

      <FabricsClient
        fabrics={fabrics}
        categories={categories}
        canEdit={canEdit}
        canManageCategories={canManageCategories}
        currentCategoryId={categoryId}
        searchQuery={search ?? ""}
      />
    </div>
  );
}
