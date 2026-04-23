"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

interface Manager {
  id: string;
  name: string;
}

interface ManagerPlanSettingsProps {
  managers: Manager[];
  initialPlans: Record<string, number>;
}

export function ManagerPlanSettings({ managers, initialPlans }: ManagerPlanSettingsProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<Record<string, string>>(
    Object.fromEntries(managers.map((m) => [m.id, (initialPlans[m.id] ?? "").toString()]))
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const numericPlans: Record<string, number> = {};
    for (const [id, val] of Object.entries(plans)) {
      const n = Number(val);
      if (n > 0) numericPlans[id] = n;
    }
    await fetch("/api/settings/year-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans: numericPlans }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  if (managers.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет активных менеджеров</p>;
  }

  return (
    <div className="space-y-3">
      {managers.map((m) => (
        <div key={m.id} className="flex items-center gap-3">
          <span className="text-sm w-40 shrink-0">{m.name}</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={plans[m.id] ?? ""}
              onChange={(e) => setPlans({ ...plans, [m.id]: e.target.value })}
              placeholder="0"
              className="w-40 px-3 py-1.5 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
            />
            <span className="text-sm text-muted-foreground">₽</span>
          </div>
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <Save className="h-3.5 w-3.5" />
        {saved ? "Сохранено!" : "Сохранить"}
      </button>
    </div>
  );
}
