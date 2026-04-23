import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { shouldFilterByManager } from "@/lib/permissions";
import { z } from "zod";

const updateClientSchema = z.object({
  dateReceived: z.string().optional(),
  meetingDate: z.string().optional(),
  projectDate: z.string().optional().nullable(),
  venue: z.string().optional(),
  projectType: z.enum(["WEDDING", "CORPORATE", "BIRTHDAY", "OTHER"]).optional(),
  status: z.enum(["MEETING", "DISCUSSION", "ESTIMATE", "CONTRACT", "REJECTED"]).optional(),
  clientName: z.string().min(1).optional(),
  source: z.string().optional(),
  projectIdea: z.string().optional(),
});

async function getClientOrFail(id: string, userId: string, role: string) {
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return null;
  if (shouldFilterByManager(role as any) && client.managerId !== userId) return null;
  return client;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const client = await getClientOrFail(params.id, user.id, user.role);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const clientWithRelations = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      manager: { select: { id: true, name: true } },
      estimates: true,
      contract: { select: { id: true, contractNumber: true } },
    },
  });

  return NextResponse.json({ data: clientWithRelations });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await getClientOrFail(params.id, user.id, user.role);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updated = await prisma.client.update({
    where: { id: params.id },
    data: {
      ...(data.dateReceived && { dateReceived: new Date(data.dateReceived) }),
      ...(data.meetingDate !== undefined && { meetingDate: data.meetingDate }),
      ...(data.projectDate !== undefined && {
        projectDate: data.projectDate ? new Date(data.projectDate) : null,
      }),
      ...(data.venue !== undefined && { venue: data.venue }),
      ...(data.projectType && { projectType: data.projectType }),
      ...(data.status && { status: data.status }),
      ...(data.clientName && { clientName: data.clientName }),
      ...(data.source !== undefined && { source: data.source }),
      ...(data.projectIdea !== undefined && { projectIdea: data.projectIdea }),
    },
  });

  await logAction(user.id, Actions.CLIENT_UPDATE, "client", params.id, {
    changes: data,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.client.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "MANAGER" && existing.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.client.delete({ where: { id: params.id } });
  await logAction(user.id, Actions.CLIENT_DELETE, "client", params.id, {
    clientName: existing.clientName,
  });

  return NextResponse.json({ message: "Deleted" });
}
