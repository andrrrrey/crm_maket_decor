"use client";

import { FileText, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface FileItem {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string | Date;
  version?: number;
  isTeamVersion?: boolean;
}

interface FileListProps {
  files: FileItem[];
  onDelete?: (id: string) => void;
  canDelete?: boolean;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(fileName: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

export function FileList({ files, onDelete, canDelete = false, className }: FileListProps) {
  if (!files.length) {
    return (
      <p className="text-sm text-muted-foreground py-2">Файлы не прикреплены</p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-2.5 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors"
        >
          {isImage(file.fileName) ? (
            <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(file.fileSize)}
              {file.version && ` · v${file.version}`}
              {file.isTeamVersion && " · ТЗ для команды"}
              {" · "}
              {format(new Date(file.uploadedAt), "dd.MM.yyyy", { locale: ru })}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`/api/files/${file.filePath}`}
              download={file.fileName}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Скачать"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(file.id)}
                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Удалить"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
