import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { shouldFilterByManager } from "@/lib/permissions";
import { z } from "zod";

const updateSchema = z.object({
  contractNumber: z.number().int().positive().optional(),
  dateSignedAt: z.string().optional(),
  installDate: z.string().optional(),
  mockupStatus: z.enum(["APPROVED", "WAITING", "IN_PROGRESS", "PENDING", "TRANSFERRED", "CANCELLED"]).optional(),
  clientName: z.string().optional(),
  organizerName: z.string().optional().nullable(),
  venue: z.string().optional(),
  totalAmount: z.number().optional().nullable(),
  prepaymentDate: z.string().optional(),
  prepaymentAmount: z.number().optional().nullable(),
  invoiceNumber: z.string().optional(),
  orgAmount: z.number().optional().nullable(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      manager: { select: { id: true, name: true } },
      sourceClient: { select: { id: true, clientName: true } },
      estimates: { orderBy: { version: "asc" } },
      contractFiles: { orderBy: { uploadedAt: "desc" } },
      mockupImages: { orderBy: { uploadedAt: "desc" } },
      project: { select: { id: true, number: true } },
    },
  });

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (shouldFilterByManager(user.role) && contract.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: contract });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (shouldFilterByManager(user.role) && existing.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updated = await prisma.contract.update({
    where: { id: params.id },
    data: {
      ...(data.contractNumber !== undefined && { contractNumber: data.contractNumber }),
      ...(data.dateSignedAt && { dateSignedAt: new Date(data.dateSignedAt) }),
      ...(data.installDate && { installDate: new Date(data.installDate) }),
      ...(data.mockupStatus && { mockupStatus: data.mockupStatus }),
      ...(data.clientName && { clientName: data.clientName }),
      ...(data.organizerName !== undefined && { organizerName: data.organizerName }),
      ...(data.venue !== undefined && { venue: data.venue }),
      ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
      ...(data.prepaymentDate !== undefined && { prepaymentDate: data.prepaymentDate }),
      ...(data.prepaymentAmount !== undefined && { prepaymentAmount: data.prepaymentAmount }),
      ...(data.invoiceNumber !== undefined && { invoiceNumber: data.invoiceNumber }),
      ...(data.orgAmount !== undefined && { orgAmount: data.orgAmount }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  await logAction(user.id, Actions.CONTRACT_UPDATE, "contract", params.id, { changes: data });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "MANAGER" && existing.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.contract.delete({ where: { id: params.id } });
  await logAction(user.id, Actions.CONTRACT_DELETE, "contract", params.id, {
    clientName: existing.clientName,
  });

  return NextResponse.json({ message: "Deleted" });
}
