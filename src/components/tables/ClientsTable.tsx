"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { ClientStatusBadge } from "@/components/shared/StatusBadge";
import { PROJECT_TYPE_LABELS } from "@/lib/constants";
import type { ClientWithManager } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { FileText } from "lucide-react";

const columns: ColumnDef<ClientWithManager>[] = [
  {
    accessorKey: "number",
    header: "№",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">#{row.original.number}</span>
    ),
  },
  {
    accessorKey: "clientName",
    header: "Клиент",
    cell: ({ row }) => (
      <Link
        href={`/clients/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.original.clientName}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Статус",
    cell: ({ row }) => <ClientStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "projectType",
    header: "Тип",
    cell: ({ row }) => (
      <span className="text-sm">{PROJECT_TYPE_LABELS[row.original.projectType]}</span>
    ),
  },
  {
    accessorKey: "projectDate",
    header: "Дата мероприятия",
    cell: ({ row }) =>
      row.original.projectDate
        ? format(new Date(row.original.projectDate), "dd.MM.yyyy", { locale: ru })
        : "—",
  },
  {
    accessorKey: "venue",
    header: "Площадка",
    cell: ({ row }) => row.original.venue ?? "—",
  },
  {
    accessorKey: "manager.name",
    header: "Менеджер",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.manager?.name}
      </span>
    ),
  },
  {
    accessorKey: "_count.estimates",
    header: "Сметы",
    cell: ({ row }) => {
      const count = row.original._count?.estimates ?? 0;
      return count > 0 ? (
        <span className="flex items-center gap-1 text-sm">
          <FileText className="h-3.5 w-3.5" />
          {count}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Обращение",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "dd.MM.yyyy", { locale: ru }),
  },
];

interface ClientsTableProps {
  data: ClientWithManager[];
}

export function ClientsTable({ data }: ClientsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Поиск по клиентам..."
    />
  );
}
