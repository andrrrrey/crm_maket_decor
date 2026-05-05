import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.contractTask.findMany({
    where: { contractId: params.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: tasks });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();

  if (body.deleteId) {
    await prisma.contractTask.delete({ where: { id: body.deleteId } });
    return NextResponse.json({ message: "Deleted" });
  }

  if (body.toggleId) {
    const task = await prisma.contractTask.findUnique({ where: { id: body.toggleId } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.contractTask.update({
      where: { id: body.toggleId },
      data: {
        isCompleted: !task.isCompleted,
        completedBy: !task.isCompleted ? user.name : null,
        completedAt: !task.isCompleted ? new Date() : null,
      },
    });
    return NextResponse.json({ data: updated });
  }

  const { title, taskType = "task" } = body;
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const maxOrder = await prisma.contractTask.aggregate({
    where: { contractId: params.id },
    _max: { sortOrder: true },
  });

  const task = await prisma.contractTask.create({
    data: {
      contractId: params.id,
      title: title.trim(),
      taskType,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
