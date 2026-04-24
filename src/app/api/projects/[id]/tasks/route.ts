import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1),
  sortOrder: z.number().optional(),
  taskType: z.string().optional(),
});

const updateTaskSchema = z.object({
  isCompleted: z.boolean().optional(),
  completedBy: z.string().optional(),
  title: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();

  // Обновление существующей задачи
  if (body.taskId) {
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const task = await prisma.projectTask.update({
      where: { id: body.taskId },
      data: {
        ...(parsed.data.isCompleted !== undefined && {
          isCompleted: parsed.data.isCompleted,
          completedBy: parsed.data.isCompleted ? (user.name ?? user.login) : null,
          completedAt: parsed.data.isCompleted ? new Date() : null,
        }),
        ...(parsed.data.title && { title: parsed.data.title }),
      },
    });
    if (parsed.data.isCompleted) {
      await logAction(user.id, Actions.TASK_COMPLETE, "project", params.id, {
        taskId: body.taskId,
      });
    }
    return NextResponse.json({ data: task });
  }

  // Создание новой задачи
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.projectTask.count({ where: { projectId: params.id } });
  const task = await prisma.projectTask.create({
    data: {
      projectId: params.id,
      title: parsed.data.title,
      sortOrder: parsed.data.sortOrder ?? count,
      taskType: parsed.data.taskType ?? "task",
    },
  });

  await logAction(user.id, Actions.TASK_CREATE, "project", params.id, {
    title: parsed.data.title,
  });

  return NextResponse.json({ data: task }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  await prisma.projectTask.delete({ where: { id: taskId } });
  await logAction(user.id, Actions.TASK_DELETE, "project", params.id, { taskId });

  return NextResponse.json({ message: "Deleted" });
}
