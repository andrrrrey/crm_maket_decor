"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X, Trash2, Upload } from "lucide-react";
import { FileUpload } from "@/components/files/FileUpload";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface ClientActionsProps {
  client: {
    id: string;
    status: string;
    isRejected: boolean;
    contract: { id: string } | null;
    managerId: string;
  };
  userId: string;
  userRole: string;
}

export function ClientActions({ client, userId, userRole }: ClientActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTeamVersion, setIsTeamVersion] = useState(false);

  const canDelete =
    userRole === "DIRECTOR" ||
    (userRole === "MANAGER" && client.managerId === userId);

  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    setLoading(false);
    setShowDeleteDialog(false);
    window.location.href = "/clients";
  };

  const handleConvert = async () => {
    setLoading(true);
    const res = await fetch(`/api/clients/${client.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setLoading(false);
    setShowConvertDialog(false);
    if (data.data?.contractId) {
      window.location.href = `/contracts/${data.data.contractId}`;
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    await fetch(`/api/clients/${client.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setLoading(false);
    setShowRejectDialog(false);
    router.refresh();
  };

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      if (isTeamVersion) form.append("isTeamVersion", "true");
      await fetch(`/api/clients/${client.id}/files`, { method: "POST", body: form });
    }
    router.refresh();
    setShowUpload(false);
    setIsTeamVersion(false);
  };

  return (
    <div className="flex items-center gap-1">
      {/* Загрузить смету */}
      <button
        onClick={() => setShowUpload(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background hover:bg-accent text-sm font-medium transition-colors"
        title="Загрузить смету"
      >
        <Upload className="h-3.5 w-3.5" />
        Смету
      </button>

      {/* В договор */}
      {!client.contract && !client.isRejected && (
        <button
          onClick={() => setShowConvertDialog(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background hover:bg-accent text-sm font-medium transition-colors text-green-700 dark:text-green-400"
          title="Перевести в договор"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          В договор
        </button>
      )}

      {/* Отказ */}
      {!client.isRejected && (
        <button
          onClick={() => setShowRejectDialog(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background hover:bg-accent text-sm font-medium transition-colors text-amber-700 dark:text-amber-400"
          title="Отметить как отказ"
        >
          <X className="h-3.5 w-3.5" />
          Отказ
        </button>
      )}

      {/* Удалить */}
      {canDelete && (
        <button
          onClick={() => setShowDeleteDialog(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background hover:bg-accent text-sm font-medium transition-colors text-destructive"
          title="Удалить клиента"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Удалить
        </button>
      )}

      {/* Диалог удаления */}
      <ConfirmDialog
        open={showDeleteDialog}
        title="Удалить клиента?"
        description="Это действие необратимо. Клиент и все связанные данные будут удалены."
        confirmLabel="Удалить"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        loading={loading}
      />

      {/* Диалог перевода в договор */}
      <ConfirmDialog
        open={showConvertDialog}
        title="Перевести в договор?"
        description="Клиент будет переведён в договор. Будет автоматически создан проект со статусом «Бронь»."
        confirmLabel="Перевести"
        variant="default"
        onConfirm={handleConvert}
        onCancel={() => setShowConvertDialog(false)}
        loading={loading}
      />

      {/* Диалог загрузки сметы */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Загрузить смету</h3>
            <FileUpload
              onUpload={handleUpload}
              accept=".xlsx,.xls,.pdf"
              label="Выберите файл сметы (Excel, PDF)"
            />
            <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isTeamVersion}
                onChange={(e) => setIsTeamVersion(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Командная версия (ТЗ без цен)</span>
            </label>
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

      {/* Диалог отказа */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Причина отказа</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Укажите причину отказа..."
              rows={4}
              className="w-full p-3 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                Подтвердить отказ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
