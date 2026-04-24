"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import { MockupStatusBadge } from "@/components/shared/StatusBadge";
import type { ContractWithManager } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { X } from "lucide-react";

function MockupThumbnail({ filePath, fileName }: { filePath: string; fileName: string }) {
  const [open, setOpen] = useState(false);
  const src = `/api/files/${filePath}`;

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        className="block rounded overflow-hidden border hover:ring-2 hover:ring-primary transition-all"
      >
        <img
          src={src}
          alt={fileName}
          className="w-10 h-10 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-background rounded-lg overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={src}
              alt={fileName}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

const columns: ColumnDef<ContractWithManager>[] = [
  {
    accessorKey: "contractNumber",
    header: "№",
    cell: ({ row }) => (
      <Link href={`/contracts/${row.original.id}`} className="text-muted-foreground text-xs hover:text-primary transition-colors">
        №{row.original.contractNumber}
      </Link>
    ),
  },
  {
    accessorKey: "installDate",
    header: "Дата монтажа",
    cell: ({ row }) =>
      format(new Date(row.original.installDate), "dd.MM.yyyy", { locale: ru }),
  },
  {
    accessorKey: "mockupStatus",
    header: "Макет",
    cell: ({ row }) => <MockupStatusBadge status={row.original.mockupStatus} />,
  },
  {
    id: "layoutImage",
    header: "Рисунок",
    cell: ({ row }) => {
      const img = row.original.mockupImages?.[0];
      if (!img) return <span className="text-muted-foreground text-xs">—</span>;
      return <MockupThumbnail filePath={img.filePath} fileName={img.fileName} />;
    },
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
    accessorKey: "organizerName",
    header: "Организатор",
    cell: ({ row }) => (row.original as any).organizerName ?? "—",
  },
  {
    accessorKey: "venue",
    header: "Площадка",
    cell: ({ row }) => row.original.venue ?? "—",
  },
  {
    accessorKey: "totalAmount",
    header: "Общая сумма",
    cell: ({ row }) =>
      row.original.totalAmount
        ? `${Number(row.original.totalAmount).toLocaleString("ru-RU")} ₽`
        : "—",
  },
  {
    accessorKey: "prepaymentDate",
    header: "Дата предоплаты",
    cell: ({ row }) => row.original.prepaymentDate ?? "—",
  },
  {
    accessorKey: "invoiceNumber",
    header: "№ счёта",
    cell: ({ row }) => row.original.invoiceNumber ?? "—",
  },
  {
    accessorKey: "prepaymentAmount",
    header: "Сумма предоплаты",
    cell: ({ row }) =>
      row.original.prepaymentAmount
        ? `${Number(row.original.prepaymentAmount).toLocaleString("ru-RU")} ₽`
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
