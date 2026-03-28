"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { MockupStatusBadge } from "@/components/shared/StatusBadge";
import type { ContractWithManager } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

const columns: ColumnDef<ContractWithManager>[] = [
  {
    accessorKey: "contractNumber",
    header: "№",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        №{row.original.contractNumber}
      </span>
    ),
  },
  {
    accessorKey: "clientName",
    header: "Заказчик",
    cell: ({ row }) => (
      <Link
        href={`/contracts/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.original.clientName}
      </Link>
    ),
  },
  {
    accessorKey: "mockupStatus",
    header: "Макет",
    cell: ({ row }) => <MockupStatusBadge status={row.original.mockupStatus} />,
  },
  {
    accessorKey: "installDate",
    header: "Дата монтажа",
    cell: ({ row }) =>
      format(new Date(row.original.installDate), "dd.MM.yyyy", { locale: ru }),
  },
  {
    accessorKey: "venue",
    header: "Площадка",
    cell: ({ row }) => row.original.venue ?? "—",
  },
  {
    accessorKey: "totalAmount",
    header: "Сумма",
    cell: ({ row }) =>
      row.original.totalAmount
        ? `${Number(row.original.totalAmount).toLocaleString("ru-RU")} ₽`
        : "—",
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
    accessorKey: "dateSignedAt",
    header: "Дата договора",
    cell: ({ row }) =>
      format(new Date(row.original.dateSignedAt), "dd.MM.yyyy", { locale: ru }),
  },
];

interface ContractsTableProps {
  data: ContractWithManager[];
}

export function ContractsTable({ data }: ContractsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Поиск по договорам..."
    />
  );
}
