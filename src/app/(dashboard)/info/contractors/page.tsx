import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, ArrowLeft } from "lucide-react";
import { AddContractorButton, EditContractorButton, DeleteContractorButton } from "./ContractorActions";

export default async function ContractorsPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!canAccess(user.role, "info", user.hasInfoAccess)) {
    notFound();
  }

  const contractors = await prisma.contractor.findMany({
    orderBy: [{ category: "asc" }, { companyName: "asc" }],
  });

  const byCategory: Record<string, typeof contractors> = {};
  for (const c of contractors) {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/info/staff" className="p-2 rounded-md hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Подрядчики</h1>
        {user.role === "DIRECTOR" && (
          <div className="ml-auto">
            <AddContractorButton />
          </div>
        )}
      </div>

      {Object.entries(byCategory).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border bg-card relative">
                {user.role === "DIRECTOR" && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <EditContractorButton contractor={{
                      id: c.id,
                      category: c.category,
                      companyName: c.companyName,
                      address: c.address,
                      phone: c.phone,
                      notes: c.notes,
                    }} />
                    <DeleteContractorButton contractorId={c.id} />
                  </div>
                )}
                <div className="font-medium text-sm">{c.companyName}</div>
                {c.address && (
                  <div className="text-xs text-muted-foreground mt-1">{c.address}</div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Phone className="h-3 w-3" />
                    {c.phone}
                  </div>
                )}
                {c.notes && (
                  <div className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap border-t pt-2">
                    {c.notes}
                  </div>
                )}
                {c.recordedBy && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Записал: {c.recordedBy}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
