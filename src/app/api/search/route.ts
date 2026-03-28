import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shouldFilterByManager } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ data: { clients: [], contracts: [], projects: [] } });
  }

  const managerFilter = shouldFilterByManager(user.role)
    ? { managerId: user.id }
    : {};

  const [clients, contracts, projects] = await Promise.all([
    prisma.client.findMany({
      where: {
        ...managerFilter,
        isRejected: false,
        OR: [
          { clientName: { contains: q, mode: "insensitive" } },
          { venue: { contains: q, mode: "insensitive" } },
          { source: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, clientName: true, status: true, venue: true },
      take: 5,
    }),
    prisma.contract.findMany({
      where: {
        ...managerFilter,
        OR: [
          { clientName: { contains: q, mode: "insensitive" } },
          { venue: { contains: q, mode: "insensitive" } },
          { invoiceNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, clientName: true, contractNumber: true, venue: true },
      take: 5,
    }),
    prisma.project.findMany({
      where: {
        ...managerFilter,
        OR: [
          { venue: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, venue: true, number: true, date: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ data: { clients, contracts, projects } });
}
