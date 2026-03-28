import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { shouldFilterByManager } from "@/lib/permissions";

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

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { estimates: true },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (shouldFilterByManager(user.role) && client.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (client.contract) {
    return NextResponse.json({ error: "Already converted" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  // Создать договор на основе данных клиента
  const contract = await prisma.contract.create({
    data: {
      dateSignedAt: body.dateSignedAt ? new Date(body.dateSignedAt) : new Date(),
      installDate: client.projectDate ?? new Date(),
      clientName: client.clientName,
      venue: client.venue,
      managerId: client.managerId,
      sourceClientId: client.id,
    },
  });

  // Перенести файлы смет: clientId → contractId
  if (client.estimates.length > 0) {
    await prisma.estimateFile.updateMany({
      where: { clientId: client.id },
      data: { contractId: contract.id },
    });
  }

  // Обновить статус клиента
  await prisma.client.update({
    where: { id: client.id },
    data: { status: "CONTRACT" },
  });

  await logAction(user.id, Actions.CLIENT_CONVERT, "client", client.id, {
    contractId: contract.id,
    clientName: client.clientName,
  });

  return NextResponse.json({ data: { contractId: contract.id } });
}
