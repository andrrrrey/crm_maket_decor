import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  fromEmail: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const entries = await prisma.mailEntry.findMany({
    where: unreadOnly ? { isRead: false } : {},
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: entries });
}

export async function POST(req: NextRequest) {
  // Публичный endpoint для входящих заявок с сайта
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.mailEntry.create({
    data: {
      fromEmail: parsed.data.fromEmail,
      subject: parsed.data.subject,
      body: parsed.data.body,
    },
  });

  // Уведомить через Socket.io если доступен
  if (typeof global !== "undefined" && (global as any).io) {
    (global as any).io.to("general").emit("mail:new", entry);
  }

  return NextResponse.json({ data: entry }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, isRead, assignedTo } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const entry = await prisma.mailEntry.update({
    where: { id },
    data: {
      ...(isRead !== undefined && { isRead }),
      ...(assignedTo !== undefined && { assignedTo }),
    },
  });

  return NextResponse.json({ data: entry });
}
