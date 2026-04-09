import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMockupSchema = z.object({
  status: z.string().optional(),
  startDate: z.string().optional(),
  installDate: z.string().optional(),
  daysToComplete: z.number().optional(),
  complexity: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  const mockup = await prisma.mockup.findUnique({
    where: { id: params.id },
    include: {
      designer: { select: { id: true, name: true } },
      images: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!mockup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "DESIGNER" && mockup.designerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: mockup });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.role !== "DIRECTOR" && user.role !== "DESIGNER" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mockup = await prisma.mockup.findUnique({ where: { id: params.id } });
  if (!mockup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "DESIGNER" && mockup.designerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateMockupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updated = await prisma.mockup.update({
    where: { id: params.id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.installDate && { installDate: new Date(data.installDate) }),
      ...(data.daysToComplete !== undefined && { daysToComplete: data.daysToComplete }),
      ...(data.complexity !== undefined && { complexity: data.complexity }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.role !== "DIRECTOR" && user.role !== "DESIGNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mockup = await prisma.mockup.findUnique({ where: { id: params.id } });
  if (!mockup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "DESIGNER" && mockup.designerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.mockup.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Deleted" });
}
