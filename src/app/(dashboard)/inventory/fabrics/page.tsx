export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AddFabricButton,
  AddFabricCategoryButton,
} from "./FabricActions";
import { FabricsClient } from "./FabricsClient";

export default async function FabricsPage({
  searchParams,
}: {
  searchParams: { categoryId?: string };
}) {
  const session = await auth();
  const user = session?.user as any;
  const canEdit = user.role === "DIRECTOR" || user.role === "PRODUCTION";
  const canManageCategories = user.role === "DIRECTOR";

  const categoryId = searchParams.categoryId;

  const [fabrics, categories] = await Promise.all([
    (prisma as any).fabric.findMany({
      where: categoryId ? { categoryId } : {},
      orderBy: [{ material: "asc" }, { color: "asc" }],
    }),
    (prisma as any).fabricCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ткани</h1>
          <p className="text-sm text-muted-foreground">{fabrics.length} позиций</p>
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-2">
          {canManageCategories && <AddFabricCategoryButton />}
          <AddFabricButton categories={categories} />
        </div>
      )}

      <FabricsClient
        fabrics={fabrics}
        categories={categories}
        canEdit={canEdit}
        canManageCategories={canManageCategories}
        currentCategoryId={categoryId}
        searchQuery=""
      />
    </div>
  );
}
