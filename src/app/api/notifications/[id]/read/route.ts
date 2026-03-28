import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  await prisma.notification.updateMany({
    where: { id: params.id, userId: user.id },
    data: { isRead: true },
  });

  return NextResponse.json({ message: "OK" });
}
