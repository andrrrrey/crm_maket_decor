import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { STAFF_SECTION_LABELS } from "@/lib/constants";
import Link from "next/link";
import { Phone, Car } from "lucide-react";
import { AddStaffButton, EditStaffButton } from "./StaffActions";

export default async function StaffPage() {
  const session = await auth();
  const user = session?.user as any;

  if (!canAccess(user.role, "info", user.hasInfoAccess)) {
    notFound();
  }

  const staff = await prisma.staff.findMany({
    orderBy: [{ section: "asc" }, { fullName: "asc" }],
  });

  const bySection: Record<string, typeof staff> = {};
  for (const s of staff) {
    if (!bySection[s.section]) bySection[s.section] = [];
    bySection[s.section].push(s);
  }

  const sectionOrder = ["CORE_TEAM", "FREELANCE_MALE", "FREELANCE_FEMALE", "DRIVERS"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Персонал</h1>
        <div className="flex items-center gap-2">
          {user.role === "DIRECTOR" && <AddStaffButton />}
          <Link
            href="/info/contractors"
            className="px-4 py-2 border rounded-md text-sm hover:bg-accent transition-colors"
          >
            Подрядчики
          </Link>
        </div>
      </div>

      {sectionOrder.map((section) => {
        const members = bySection[section];
        if (!members?.length) return null;

        return (
          <div key={section}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              {STAFF_SECTION_LABELS[section as keyof typeof STAFF_SECTION_LABELS]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {members.map((person) => (
                <div key={person.id} className="p-3 rounded-lg border bg-card relative">
                  {user.role === "DIRECTOR" && (
                    <div className="absolute top-2 right-2">
                      <EditStaffButton person={{
                        id: person.id,
                        section: person.section,
                        fullName: person.fullName,
                        position: person.position,
                        phone: person.phone,
                        hasVehicle: person.hasVehicle,
                        startDate: person.startDate,
                        notes: person.notes,
                      }} />
                    </div>
                  )}
                  <div className="font-medium text-sm">{person.fullName}</div>
                  <div className="text-xs text-muted-foreground">{person.position}</div>
                  <div className="mt-2 space-y-1">
                    {person.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {person.phone}
                      </div>
                    )}
                    {person.hasVehicle && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Car className="h-3 w-3" />
                        {person.hasVehicle}
                      </div>
                    )}
                    {person.startDate && (
                      <div className="text-xs text-muted-foreground">
                        С {person.startDate}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
