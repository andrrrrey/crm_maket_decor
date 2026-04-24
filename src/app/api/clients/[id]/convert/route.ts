import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { format } from "date-fns";

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
    include: { estimates: true, contract: true },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "MANAGER" && client.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (client.contract) {
    return NextResponse.json({ error: "Already converted" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

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

  // Create a calendar entry for the installation date
  const installDate = client.projectDate ?? new Date();
  const label = [
    `№${contract.contractNumber}`,
    client.clientName,
    client.venue,
  ].filter(Boolean).join(" · ");

  await prisma.calendarEntry.create({
    data: {
      date: installDate,
      label,
      color: "#3B82F6",
      entryType: "contract",
    },
  });

  // Create a project in RESERVATION status (green) linked to the contract
  await prisma.project.create({
    data: {
      date: installDate,
      venue: client.venue,
      month: format(installDate, "yyyy-MM"),
      calendarColor: "#34D399",
      projectStatus: "RESERVATION",
      managerId: client.managerId,
      contractId: contract.id,
    },
  });

  // Transfer estimate files from client to contract
  if (client.estimates.length > 0) {
    await prisma.estimateFile.updateMany({
      where: { clientId: client.id },
      data: { contractId: contract.id },
    });
  }

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
