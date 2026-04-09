import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddFabricButton, EditFabricButton } from "./FabricActions";

export default async function FabricsPage() {
  const session = await auth();
  const user = session?.user as any;
  const canEdit = user.role === "DIRECTOR" || user.role === "PRODUCTION";

  const fabrics = await prisma.fabric.findMany({
    orderBy: [{ material: "asc" }, { color: "asc" }],
  });

  // Группировать по материалу
  const byMaterial: Record<string, typeof fabrics> = {};
  for (const f of fabrics) {
    if (!byMaterial[f.material]) byMaterial[f.material] = [];
    byMaterial[f.material].push(f);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/inventory" className="p-2 rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Ткани</h1>
        {canEdit && (
          <div className="ml-auto">
            <AddFabricButton />
          </div>
        )}
      </div>

      {Object.keys(byMaterial).length === 0 ? (
        <p className="text-muted-foreground">Данных нет</p>
      ) : (
        Object.entries(byMaterial).map(([material, items]) => (
          <div key={material} className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/30 font-medium text-sm">{material}</div>
            <div className="divide-y">
              {items.map((fabric) => (
                <div key={fabric.id} className="px-4 py-3 flex items-center justify-between text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                    <div>
                      <span className="font-medium">{fabric.color}</span>
                      {fabric.width && (
                        <span className="text-muted-foreground"> · {fabric.width}см</span>
                      )}
                    </div>
                    {fabric.cuts && (
                      <div className="text-muted-foreground truncate">{fabric.cuts}</div>
                    )}
                    {fabric.totalLength && (
                      <div>
                        <span className="font-mono">{Number(fabric.totalLength)} м</span>
                      </div>
                    )}
                    {(fabric.supplier || fabric.yearBought) && (
                      <div className="text-muted-foreground text-xs">
                        {fabric.supplier} {fabric.yearBought && `(${fabric.yearBought})`}
                      </div>
                    )}
                  </div>
                  {canEdit && (
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
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
