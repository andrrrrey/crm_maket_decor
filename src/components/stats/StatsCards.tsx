"use client";

import { Users, FileText, FolderKanban, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalClients: number;
  totalContracts: number;
  totalProjects: number;
  conversionRate: number;
}

export function StatsCards({
  totalClients,
  totalContracts,
  totalProjects,
  conversionRate,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Активных клиентов",
      value: totalClients,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Договоров",
      value: totalContracts,
      icon: FileText,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Проектов",
      value: totalProjects,
      icon: FolderKanban,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Конверсия",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`p-4 rounded-lg border ${card.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">
              {typeof card.value === "number" ? card.value.toLocaleString("ru-RU") : card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
