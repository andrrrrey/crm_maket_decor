import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function FabricsPage() {
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
      </div>

      {Object.keys(byMaterial).length === 0 ? (
        <p className="text-muted-foreground">Данных нет</p>
      ) : (
        Object.entries(byMaterial).map(([material, items]) => (
          <div key={material} className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/30 font-medium text-sm">{material}</div>
            <div className="divide-y">
              {items.map((fabric) => (
                <div key={fabric.id} className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
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
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
