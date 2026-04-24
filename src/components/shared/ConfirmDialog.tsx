"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Удалить",
  cancelLabel = "Отмена",
  variant = "destructive",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-tight">{title}</h3>
              <button
                onClick={onCancel}
                disabled={loading}
                className="shrink-0 p-0.5 rounded hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-md font-medium transition-colors disabled:opacity-50 ${
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
