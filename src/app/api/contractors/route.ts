import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { z } from "zod";

const createSchema = z.object({
  category: z.string().min(1),
  companyName: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  telegramLink: z.string().optional(),
  recordedBy: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contractors = await prisma.contractor.findMany({
    orderBy: [{ category: "asc" }, { companyName: "asc" }],
  });

  return NextResponse.json({ data: contractors });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.id) {
    const c = await prisma.contractor.update({
      where: { id: body.id },
      data: { ...body, id: undefined },
    });
    await logAction(user.id, Actions.CONTRACTOR_UPDATE, "contractor", body.id);
    return NextResponse.json({ data: c });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const contractor = await prisma.contractor.create({ data: parsed.data });
  await logAction(user.id, Actions.CONTRACTOR_CREATE, "contractor", contractor.id, {
    companyName: contractor.companyName,
  });

  return NextResponse.json({ data: contractor }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.contractor.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contractor.delete({ where: { id } });
  await logAction(user.id, Actions.CONTRACTOR_DELETE, "contractor", id, {
    companyName: existing.companyName,
  });

  return NextResponse.json({ message: "Deleted" });
}
