export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { InfoTabs } from "./InfoTabs";

export default async function StaffPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!canAccess(user.role, "info", user.hasInfoAccess)) {
    notFound();
  }

  const [staff, contractors] = await Promise.all([
    prisma.staff.findMany({
      orderBy: [{ section: "asc" }, { fullName: "asc" }],
    }),
    prisma.contractor.findMany({
      orderBy: [{ category: "asc" }, { companyName: "asc" }],
    }),
  ]);

  const staffBySection: Record<string, typeof staff> = {};
  for (const s of staff) {
    if (!staffBySection[s.section]) staffBySection[s.section] = [];
    staffBySection[s.section].push(s);
  }

  const isDirector = user.role === "DIRECTOR";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Персонал</h1>
      <InfoTabs
        staffBySection={staffBySection}
        contractors={contractors}
        isDirector={isDirector}
      />
    </div>
  );
}
