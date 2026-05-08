import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";

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
    select: { id: true, clientName: true, projectDate: true, venue: true, source: true, managerId: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "MANAGER" && client.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Toggle: if reservation exists — remove it
  const existing = await prisma.calendarEntry.findFirst({
    where: { projectId: params.id, entryType: "client_reservation" },
  });

  if (existing) {
    await prisma.calendarEntry.delete({ where: { id: existing.id } });
    await logAction(user.id, Actions.CLIENT_UPDATE, "client", params.id, { reservation: "removed" });
    return NextResponse.json({ data: { reserved: false } });
  }

  if (!client.projectDate) {
    return NextResponse.json({ error: "Дата мероприятия не указана" }, { status: 400 });
  }

  const labelParts = [client.venue, client.clientName].filter(Boolean);
  await prisma.calendarEntry.create({
    data: {
      date: client.projectDate,
      label: labelParts.join(" · "),
      color: "#22c55e",
      entryType: "client_reservation",
      projectId: params.id,
    },
  });

  await logAction(user.id, Actions.CLIENT_UPDATE, "client", params.id, { reservation: "added" });
  return NextResponse.json({ data: { reserved: true } });
}
