import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.contractMessage.findMany({
    where: { contractId: params.id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({ data: messages });
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
    const msg = await prisma.contractMessage.findUnique({ where: { id: body.deleteId } });
    if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (msg.userId !== user.id && user.role !== "DIRECTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.contractMessage.delete({ where: { id: body.deleteId } });
    return NextResponse.json({ message: "Deleted" });
  }

  const { text } = body;
  if (!text?.trim()) {
    return NextResponse.json({ error: "Text required" }, { status: 400 });
  }

  const message = await prisma.contractMessage.create({
    data: {
      contractId: params.id,
      userId: user.id,
      text: text.trim(),
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json({ data: message }, { status: 201 });
}
