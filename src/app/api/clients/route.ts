import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { shouldFilterByManager } from "@/lib/permissions";
import { z } from "zod";

const createClientSchema = z.object({
  dateReceived: z.string(),
  meetingDate: z.string().optional(),
  projectDate: z.string().optional(),
  venue: z.string().optional(),
  projectType: z.enum(["WEDDING", "CORPORATE", "BIRTHDAY", "OTHER"]).default("WEDDING"),
  status: z.enum(["MEETING", "DISCUSSION", "ESTIMATE", "CONTRACT", "REJECTED"]).default("MEETING"),
  clientName: z.string().min(1),
  source: z.string().optional(),
  projectIdea: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const showRejected = searchParams.get("rejected") === "true";
  const managerId = searchParams.get("managerId");

  const where: any = {
    isRejected: showRejected,
  };

  if (shouldFilterByManager(user.role)) {
    where.managerId = user.id;
  } else if (managerId) {
    where.managerId = managerId;
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { estimates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: clients });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const client = await prisma.client.create({
    data: {
      dateReceived: new Date(data.dateReceived),
      meetingDate: data.meetingDate,
      projectDate: data.projectDate ? new Date(data.projectDate) : undefined,
      venue: data.venue,
      projectType: data.projectType,
      status: data.status,
      clientName: data.clientName,
      source: data.source,
      projectIdea: data.projectIdea,
      managerId: user.id,
    },
  });

  await logAction(user.id, Actions.CLIENT_CREATE, "client", client.id, {
    clientName: client.clientName,
  });

  return NextResponse.json({ data: client }, { status: 201 });
}
