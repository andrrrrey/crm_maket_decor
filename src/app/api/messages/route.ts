import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const sendSchema = z.object({
  text: z.string().min(1).max(2000),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const messages = await prisma.message.findMany({
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    take: limit,
  });

  return NextResponse.json({ data: messages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      userId: user.id,
      text: parsed.data.text,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
  });

  // Транслировать через Socket.io
  if (typeof global !== "undefined" && (global as any).io) {
    (global as any).io.to("general").emit("general:message", message);
  }

  return NextResponse.json({ data: message }, { status: 201 });
}
