"use client";

import { useRouter } from "next/navigation";
import { FileList } from "@/components/files/FileList";

interface EstimateFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
  version?: number;
  isTeamVersion?: boolean;
}

interface EstimatesListProps {
  clientId: string;
  files: EstimateFile[];
  canDelete: boolean;
}

export function EstimatesList({ clientId, files, canDelete }: EstimatesListProps) {
  const router = useRouter();

  const handleDelete = async (fileId: string) => {
    if (!confirm("Удалить файл сметы?")) return;
    await fetch(`/api/clients/${clientId}/files?fileId=${fileId}`, { method: "DELETE" });
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
