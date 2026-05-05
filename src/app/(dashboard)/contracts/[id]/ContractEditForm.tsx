"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOCKUP_STATUS_LABELS } from "@/lib/constants";
import type { ContractMockupStatus, ContractStatus } from "@/types";
import { Pencil, X, Save, ChevronDown, Upload, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/files/FileUpload";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  MONTAGE: "Монтаж",
  RESERVATION: "Бронь",
};

const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  MONTAGE: "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300",
  RESERVATION: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300",
};

export function ContractStatusSelect({
  contractId,
  currentStatus,
}: {
  contractId: string;
  currentStatus: ContractStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    setLoading(true);
    await fetch(`/api/contracts/${contractId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractStatus: newStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="relative inline-flex">
      <select
        value={currentStatus}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-full border cursor-pointer focus:ring-1 focus:ring-ring outline-none disabled:opacity-60 transition-colors ${CONTRACT_STATUS_COLORS[currentStatus]}`}
      >
        {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map((s) => (
          <option key={s} value={s} className="bg-background text-foreground">
            {CONTRACT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
    </div>
  );
}

export function ContractFabricNote({
  contractId,
  initialValue,
  canEdit,
}: {
  contractId: string;
  initialValue: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await fetch(`/api/contracts/${contractId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fabricNote: value }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!canEdit}
        placeholder="Тип материала..."
        rows={3}
        className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none resize-none disabled:opacity-60"
      />
      {canEdit && (
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-3 w-3" />
          {saved ? "Сохранено" : loading ? "Сохранение..." : "Сохранить"}
        </button>
      )}
    </div>
  );
}

interface ContractData {
  id: string;
  contractNumber: number;
  mockupStatus: ContractMockupStatus;
  clientName: string;
  organizerName: string | null;
  venue: string | null;
  totalAmount: string | null;
  prepaymentDate: string | null;
  prepaymentAmount: string | null;
  invoiceNumber: string | null;
  orgAmount: string | null;
  notes: string | null;
  dateSignedAt: string;
  installDate: string;
}

export function MockupStatusSelect({ contract }: { contract: ContractData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const statuses: ContractMockupStatus[] = [
    "PENDING", "WAITING", "IN_PROGRESS", "APPROVED", "TRANSFERRED", "CANCELLED",
  ];

  const handleChange = async (newStatus: string) => {
    if (newStatus === contract.mockupStatus) return;
    setLoading(true);
    await fetch(`/api/contracts/${contract.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mockupStatus: newStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="relative inline-flex">
      <select
        value={contract.mockupStatus}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-full border cursor-pointer focus:ring-1 focus:ring-ring outline-none disabled:opacity-60 bg-background transition-colors"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {MOCKUP_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
    </div>
  );
}

export function ContractEditForm({ contract }: { contract: ContractData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    contractNumber: contract.contractNumber.toString(),
    clientName: contract.clientName,
    organizerName: contract.organizerName ?? "",
    venue: contract.venue ?? "",
    totalAmount: contract.totalAmount ?? "",
    prepaymentDate: contract.prepaymentDate ?? "",
    prepaymentAmount: contract.prepaymentAmount ?? "",
    invoiceNumber: contract.invoiceNumber ?? "",
    orgAmount: contract.orgAmount ?? "",
    notes: contract.notes ?? "",
    dateSignedAt: contract.dateSignedAt.split("T")[0],
    installDate: contract.installDate.split("T")[0],
  });

  const handleSave = async () => {
    setLoading(true);
    await fetch(`/api/contracts/${contract.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractNumber: Number(form.contractNumber) || contract.contractNumber,
        clientName: form.clientName,
        organizerName: form.organizerName || null,
        venue: form.venue || undefined,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
        prepaymentDate: form.prepaymentDate || undefined,
        prepaymentAmount: form.prepaymentAmount ? Number(form.prepaymentAmount) : undefined,
        invoiceNumber: form.invoiceNumber || undefined,
        orgAmount: form.orgAmount ? Number(form.orgAmount) : undefined,
        notes: form.notes || undefined,
        dateSignedAt: form.dateSignedAt,
        installDate: form.installDate,
      }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="p-2 rounded-md hover:bg-accent transition-colors"
        title="Редактировать"
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Редактировать договор</h3>
          <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">№ договора</label>
              <input
                type="number"
                value={form.contractNumber}
                onChange={(e) => setForm({ ...form, contractNumber: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Заказчик</label>
              <input
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Организатор</label>
            <input
              value={form.organizerName}
              onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Дата заключения</label>
              <input
                type="date"
                value={form.dateSignedAt}
                onChange={(e) => setForm({ ...form, dateSignedAt: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Дата монтажа</label>
              <input
                type="date"
                value={form.installDate}
                onChange={(e) => setForm({ ...form, installDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Площадка</label>
            <input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Общая сумма</label>
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Сумма орг</label>
              <input
                type="number"
                value={form.orgAmount}
                onChange={(e) => setForm({ ...form, orgAmount: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Предоплата</label>
              <input
                type="number"
                value={form.prepaymentAmount}
                onChange={(e) => setForm({ ...form, prepaymentAmount: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Дата предоплаты</label>
              <input
                type="date"
                value={form.prepaymentDate}
                onChange={(e) => setForm({ ...form, prepaymentDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">№ счёта</label>
            <input
              value={form.invoiceNumber}
              onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Примечания</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !form.clientName.trim()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContractDeleteButton({
  contractId,
  managerId,
  userId,
  userRole,
}: {
  contractId: string;
  managerId: string;
  userId: string;
  userRole: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const canDelete =
    userRole === "DIRECTOR" ||
    (userRole === "MANAGER" && managerId === userId);

  if (!canDelete) return null;

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/contracts/${contractId}`, { method: "DELETE" });
    setLoading(false);
    setShowDialog(false);
    window.location.href = "/contracts";
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        disabled={loading}
        className="p-2 rounded-md hover:bg-accent transition-colors text-destructive"
        title="Удалить договор"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={showDialog}
        title="Удалить договор?"
        description="Это действие необратимо. Договор, связанный проект и все файлы будут удалены."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setShowDialog(false)}
        loading={loading}
      />
    </>
  );
}

export function ContractFileUpload({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);
  const [fileType, setFileType] = useState<"contract" | "invoice" | "other">("contract");

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      form.append("fileType", fileType);
      await fetch(`/api/contracts/${contractId}/files`, {
        method: "POST",
        body: form,
      });
    }
    router.refresh();
    setShowUpload(false);
  };

  return (
    <>
      <button
        onClick={() => setShowUpload(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded-md hover:bg-accent transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        Загрузить файл
      </button>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Загрузить файл договора</h3>
            <div className="mb-4">
              <label className="text-xs text-muted-foreground">Тип файла</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as typeof fileType)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              >
                <option value="contract">Договор</option>
                <option value="invoice">Счёт</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <FileUpload
              onUpload={handleUpload}
              accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.webp"
              label="Выберите файл"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
