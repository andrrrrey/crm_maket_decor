"use client";

import { useRouter } from "next/navigation";
import { FileList } from "./FileList";

interface FileItem {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string | Date;
  version?: number;
  isTeamVersion?: boolean;
}

interface Props {
  files: FileItem[];
  canDelete: boolean;
  deleteUrl: string;
}

export function FileListWithDelete({ files, canDelete, deleteUrl }: Props) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить файл?")) return;
    await fetch(`${deleteUrl}?fileId=${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <FileList
      files={files}
      canDelete={canDelete}
      onDelete={canDelete ? handleDelete : undefined}
    />
  );
}
