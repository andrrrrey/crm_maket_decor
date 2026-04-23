import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { z } from "zod";

const createSchema = z.object({
  section: z.enum(["CORE_TEAM", "FREELANCE_MALE", "FREELANCE_FEMALE", "DRIVERS"]),
  fullName: z.string().min(1),
  position: z.string().min(1),
  passport: z.string().optional(),
  birthDate: z.string().optional(),
  age: z.number().optional(),
  startDate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  hasVehicle: z.string().optional(),
  telegramLink: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staff = await prisma.staff.findMany({
    orderBy: [{ section: "asc" }, { fullName: "asc" }],
  });

  return NextResponse.json({ data: staff });
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
    const member = await prisma.staff.update({
      where: { id: body.id },
      data: { ...body, id: undefined },
    });
    await logAction(user.id, Actions.STAFF_UPDATE, "staff", body.id);
    return NextResponse.json({ data: member });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const member = await prisma.staff.create({
    data: {
      ...parsed.data,
      birthDate: parsed.data.birthDate
        ? new Date(parsed.data.birthDate)
        : undefined,
    },
  });
  await logAction(user.id, Actions.STAFF_CREATE, "staff", member.id, {
    fullName: member.fullName,
  });

  return NextResponse.json({ data: member }, { status: 201 });
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

  const existing = await prisma.staff.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.staff.delete({ where: { id } });
  await logAction(user.id, Actions.STAFF_DELETE, "staff", id, {
    fullName: existing.fullName,
  });

  return NextResponse.json({ message: "Deleted" });
}
