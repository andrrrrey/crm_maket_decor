import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  email: z.string().email(),
  login: z.string().min(3).max(32),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["DIRECTOR", "MANAGER", "PRODUCTION", "DESIGNER"]),
  phone: z.string().optional(),
  hasInfoAccess: z.boolean().default(false),
});

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(["DIRECTOR", "MANAGER", "PRODUCTION", "DESIGNER"]).optional(),
  isActive: z.boolean().optional(),
  hasInfoAccess: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      login: true,
      name: true,
      role: true,
      isActive: true,
      phone: true,
      hasInfoAccess: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Обновление пользователя
  if (body.id) {
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    const updateData: any = {
      ...(data.name && { name: data.name }),
      ...(data.email && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.role && { role: data.role }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.hasInfoAccess !== undefined && { hasInfoAccess: data.hasInfoAccess }),
    };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: data.id },
      data: updateData,
      select: { id: true, name: true, role: true, isActive: true },
    });

    const action = data.isActive === false ? Actions.USER_DEACTIVATE : Actions.USER_UPDATE;
    await logAction(user.id, action, "user", data.id, { changes: data });

    return NextResponse.json({ data: updated });
  }

  // Создание нового пользователя
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { login: data.login }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Пользователь с таким email или логином уже существует" },
      { status: 409 }
    );
  }

  const newUser = await prisma.user.create({
    data: {
      email: data.email,
      login: data.login,
      passwordHash: await bcrypt.hash(data.password, 10),
      name: data.name,
      role: data.role,
      phone: data.phone,
      hasInfoAccess: data.hasInfoAccess,
      settings: { create: { openMonths: [] } },
    },
    select: { id: true, name: true, login: true, role: true },
  });

  await logAction(user.id, Actions.USER_CREATE, "user", newUser.id, {
    login: newUser.login,
    role: newUser.role,
  });

  return NextResponse.json({ data: newUser }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (id === user.id) {
    return NextResponse.json({ error: "Нельзя удалить себя" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          clients: true,
          contracts: true,
          projects: true,
          designerMockups: true,
          managerTasks: true,
          expenses: true,
          messages: true,
          projectMessages: true,
          historyEntries: true,
          notifications: true,
        },
      },
    },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const counts = existing._count;
  const hasRelated =
    counts.clients > 0 ||
    counts.contracts > 0 ||
    counts.projects > 0 ||
    counts.designerMockups > 0 ||
    counts.managerTasks > 0 ||
    counts.expenses > 0 ||
    counts.messages > 0 ||
    counts.projectMessages > 0 ||
    counts.historyEntries > 0 ||
    counts.notifications > 0;

  if (hasRelated) {
    const parts: string[] = [];
    if (counts.clients > 0) parts.push(`клиентов: ${counts.clients}`);
    if (counts.contracts > 0) parts.push(`договоров: ${counts.contracts}`);
    if (counts.projects > 0) parts.push(`проектов: ${counts.projects}`);
    if (counts.designerMockups > 0) parts.push(`макетов: ${counts.designerMockups}`);
    if (counts.historyEntries > 0) parts.push(`записей истории: ${counts.historyEntries}`);
    return NextResponse.json(
      {
        error: `Нельзя удалить пользователя: у него есть связанные записи (${parts.join(", ")}). Чтобы заблокировать пользователя — снимите флаг "Активен" вместо удаления.`,
      },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  await logAction(user.id, Actions.USER_DELETE, "user", id, { login: existing.login });

  return NextResponse.json({ message: "Deleted" });
}
