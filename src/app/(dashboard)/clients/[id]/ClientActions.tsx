"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, ArrowRight, X, Pencil } from "lucide-react";
import { FileUpload } from "@/components/files/FileUpload";

interface ClientActionsProps {
  client: {
    id: string;
    status: string;
    isRejected: boolean;
    contract: { id: string } | null;
  };
  userId: string;
}

export function ClientActions({ client, userId }: ClientActionsProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!confirm("Перевести клиента в договор?")) return;
    setLoading(true);
    const res = await fetch(`/api/clients/${client.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setLoading(false);
    if (data.data?.contractId) {
      router.push(`/contracts/${data.data.contractId}`);
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
      await fetch(`/api/clients/${client.id}/files`, {
        method: "POST",
        body: form,
      });
    }
    router.refresh();
    setShowUpload(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-md hover:bg-accent transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-10 z-10 w-48 bg-popover border rounded-md shadow-md py-1">
          <button
            onClick={() => { setShowUpload(true); setShowMenu(false); }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            Загрузить смету
          </button>
          {!client.contract && !client.isRejected && (
            <>
              <button
                onClick={() => { handleConvert(); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <ArrowRight className="h-4 w-4" />
                В договор
              </button>
              <button
                onClick={() => { setShowRejectDialog(true); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Отказ
              </button>
            </>
          )}
        </div>
      )}

      {/* Диалог загрузки */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold mb-4">Загрузить смету</h3>
            <FileUpload
              onUpload={handleUpload}
              accept=".xlsx,.xls,.pdf"
              label="Выберите файл сметы (Excel, PDF)"
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
