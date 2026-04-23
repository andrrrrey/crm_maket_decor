import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { plans } = await req.json();
  if (!plans || typeof plans !== "object") {
    return NextResponse.json({ error: "Invalid plans" }, { status: 400 });
  }

  const settings = await prisma.userSettings.findFirst({
    where: { user: { role: "DIRECTOR" } },
  });

  if (settings) {
    await prisma.userSettings.update({
      where: { id: settings.id },
      data: { yearPlans: plans },
    });
  } else {
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        yearPlans: plans,
      },
    });
  }

  return NextResponse.json({ message: "Saved" });
}
