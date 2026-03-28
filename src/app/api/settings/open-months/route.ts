import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  months: z.array(z.string().regex(/^\d{4}-\d{2}$/)),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findFirst({
    where: { user: { role: "DIRECTOR" } },
  });

  return NextResponse.json({
    data: { openMonths: (settings?.openMonths as string[]) ?? [] },
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: { openMonths: parsed.data.months },
    create: { userId: user.id, openMonths: parsed.data.months },
  });

  await logAction(user.id, Actions.SETTINGS_OPEN_MONTHS, "settings", undefined, {
    months: parsed.data.months,
  });

  return NextResponse.json({ data: { openMonths: settings.openMonths } });
}
