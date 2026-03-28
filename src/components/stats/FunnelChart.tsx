"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CLIENT_STATUS_LABELS } from "@/lib/constants";
import type { ClientStatus } from "@/types";

interface FunnelChartProps {
  data: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  MEETING: "#60A5FA",
  DISCUSSION: "#FBBF24",
  ESTIMATE: "#A78BFA",
  CONTRACT: "#34D399",
  REJECTED: "#F87171",
};

export function FunnelChart({ data }: FunnelChartProps) {
  const chartData = data.map((d) => ({
    name: CLIENT_STATUS_LABELS[d.status as ClientStatus] ?? d.status,
    count: d.count,
    fill: STATUS_COLORS[d.status] ?? "#94A3B8",
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
        <Tooltip
          formatter={(value) => [`${value} клиентов`, ""]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <rect key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
