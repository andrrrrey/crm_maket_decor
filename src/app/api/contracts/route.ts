import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { shouldFilterByManager } from "@/lib/permissions";
import { z } from "zod";

const createContractSchema = z.object({
  dateSignedAt: z.string(),
  installDate: z.string(),
  mockupStatus: z
    .enum(["APPROVED", "WAITING", "IN_PROGRESS", "PENDING", "TRANSFERRED", "CANCELLED"])
    .default("PENDING"),
  clientName: z.string().min(1),
  venue: z.string().optional(),
  totalAmount: z.number().optional(),
  prepaymentDate: z.string().optional(),
  prepaymentAmount: z.number().optional(),
  invoiceNumber: z.string().optional(),
  orgAmount: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const managerId = searchParams.get("managerId");

  const where: any = {};

  if (shouldFilterByManager(user.role)) {
    where.managerId = user.id;
  } else if (managerId) {
    where.managerId = managerId;
  }

  const contracts = await prisma.contract.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      sourceClient: { select: { id: true, clientName: true } },
      _count: { select: { contractFiles: true, estimates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: contracts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createContractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const contract = await prisma.contract.create({
    data: {
      dateSignedAt: new Date(data.dateSignedAt),
      installDate: new Date(data.installDate),
      mockupStatus: data.mockupStatus,
      clientName: data.clientName,
      venue: data.venue,
      totalAmount: data.totalAmount,
      prepaymentDate: data.prepaymentDate,
      prepaymentAmount: data.prepaymentAmount,
      invoiceNumber: data.invoiceNumber,
      orgAmount: data.orgAmount,
      notes: data.notes,
      managerId: user.id,
    },
  });

  await logAction(user.id, Actions.CONTRACT_CREATE, "contract", contract.id, {
    clientName: contract.clientName,
  });

  return NextResponse.json({ data: contract }, { status: 201 });
}
