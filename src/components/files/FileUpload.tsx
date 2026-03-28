"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept,
  multiple = false,
  maxSizeMB = 50,
  label = "Загрузить файл",
  disabled = false,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);

    const fileArray = Array.from(files);
    const maxSize = maxSizeMB * 1024 * 1024;

    for (const file of fileArray) {
      if (file.size > maxSize) {
        setError(`Файл "${file.name}" превышает ${maxSizeMB}MB`);
        return;
      }
    }

    try {
      setUploading(true);
      await onUpload(fileArray);
    } catch (err) {
      setError("Ошибка при загрузке файла");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {uploading ? "Загрузка..." : label}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Перетащите или нажмите для выбора (макс. {maxSizeMB}MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
