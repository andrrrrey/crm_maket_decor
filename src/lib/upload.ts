import path from "path";
import fs from "fs";
import { createId } from "@paralleldrive/cuid2";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// Убедиться что директория существует
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Получить абсолютный путь для поддиректории
export function getUploadPath(subDir: string): string {
  const dir = path.join(UPLOAD_DIR, subDir);
  ensureDir(dir);
  return dir;
}

// Сгенерировать уникальное имя файла
export function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const id = createId();
  return `${id}_${path.basename(originalName, ext).replace(/[^a-zA-Z0-9а-яА-Я]/g, "_")}${ext}`;
}

// Удалить файл безопасно
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(UPLOAD_DIR, filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
}

// Получить публичный URL для файла
export function getFileUrl(filePath: string): string {
  // filePath хранится относительно UPLOAD_DIR
  return `/api/files/${filePath}`;
}

// Сохранить буфер в файл
export async function saveBuffer(
  buffer: Buffer,
  subDir: string,
  fileName: string
): Promise<{ fileName: string; filePath: string; fileSize: number }> {
  const dir = getUploadPath(subDir);
  const uniqueName = generateFileName(fileName);
  const fullPath = path.join(dir, uniqueName);

  fs.writeFileSync(fullPath, buffer);

  return {
    fileName,
    filePath: path.join(subDir, uniqueName),
    fileSize: buffer.length,
  };
}
