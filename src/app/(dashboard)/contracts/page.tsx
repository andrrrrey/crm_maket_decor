import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldFilterByManager } from "@/lib/permissions";
import { ContractsTable } from "@/components/tables/ContractsTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ContractWithManager } from "@/types";

export default async function ContractsPage() {
  const session = await auth();
  const user = session?.user as any;

  const where: any = {};
  if (shouldFilterByManager(user.role)) {
    where.managerId = user.id;
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      sourceClient: { select: { id: true, clientName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Договоры</h1>
          <p className="text-sm text-muted-foreground">
            {contracts.length} договоров
          </p>
        </div>
        {(user.role === "DIRECTOR" || user.role === "MANAGER") && (
          <Link
            href="/contracts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Новый договор
          </Link>
        )}
      </div>
      <ContractsTable data={contracts as ContractWithManager[]} />
    </div>
  );
}
