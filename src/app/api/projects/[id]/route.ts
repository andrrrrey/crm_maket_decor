import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { shouldFilterByManager } from "@/lib/permissions";
import { z } from "zod";
import { format } from "date-fns";

const updateSchema = z.object({
  date: z.string().optional(),
  venue: z.string().optional(),
  description: z.string().optional(),
  calendarColor: z.string().optional(),
  isCompleted: z.boolean().optional(),
  managerId: z.string().optional(),
  contractId: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      manager: { select: { id: true, name: true } },
      contract: { select: { id: true, contractNumber: true, clientName: true } },
      tasks: { orderBy: { sortOrder: "asc" } },
      purchases: { orderBy: { sortOrder: "asc" } },
      projectMessages: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
        take: 50,
      },
      projectImages: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (shouldFilterByManager(user.role) && project.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: project });
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

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
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
  const date = data.date ? new Date(data.date) : undefined;
  const month = date ? format(date, "yyyy-MM") : undefined;

  // Менеджера может менять только DIRECTOR
  if (data.managerId && data.managerId !== existing.managerId && user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Проверка: если привязываем договор, он должен быть свободен (либо уже привязан к этому проекту)
  if (data.contractId) {
    const contractOwner = await prisma.project.findUnique({
      where: { contractId: data.contractId },
      select: { id: true },
    });
    if (contractOwner && contractOwner.id !== params.id) {
      return NextResponse.json(
        { error: "Договор уже привязан к другому проекту" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(date && { date, month }),
      ...(data.venue !== undefined && { venue: data.venue }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.calendarColor && { calendarColor: data.calendarColor }),
      ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      ...(data.managerId && { managerId: data.managerId }),
      ...(data.contractId !== undefined && { contractId: data.contractId }),
    },
  });

  const action = data.isCompleted
    ? Actions.PROJECT_COMPLETE
    : Actions.PROJECT_UPDATE;
  await logAction(user.id, action, "project", params.id, { changes: data });

  return NextResponse.json({ data: updated });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();

  const patchSchema = z.object({
    projectStatus: z.string().optional(),
    fabricNote: z.string().optional(),
  });

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.projectStatus !== undefined && { projectStatus: parsed.data.projectStatus }),
      ...(parsed.data.fabricNote !== undefined && { fabricNote: parsed.data.fabricNote }),
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
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "MANAGER" && existing.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  await logAction(user.id, Actions.PROJECT_DELETE, "project", params.id);

  return NextResponse.json({ message: "Deleted" });
}
