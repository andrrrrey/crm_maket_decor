import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { shouldFilterByManager } from "@/lib/permissions";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().min(1, "Укажите причину отказа"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (shouldFilterByManager(user.role) && client.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.client.update({
    where: { id: params.id },
    data: {
      status: "REJECTED",
      isRejected: true,
      rejectionReason: parsed.data.reason,
    },
  });

  await logAction(user.id, Actions.CLIENT_REJECT, "client", params.id, {
    reason: parsed.data.reason,
    clientName: client.clientName,
  });

  return NextResponse.json({ data: updated });
}
