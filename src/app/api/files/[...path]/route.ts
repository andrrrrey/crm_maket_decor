import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = params.path.join("/");

  // Security: prevent path traversal
  const absolutePath = path.resolve(UPLOAD_DIR, filePath);
  const uploadRoot = path.resolve(UPLOAD_DIR);
  if (!absolutePath.startsWith(uploadRoot)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!existsSync(absolutePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fileBuffer = await readFile(absolutePath);
  const ext = path.extname(absolutePath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";
  const isInline = [".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": isInline
        ? `inline; filename="${path.basename(absolutePath)}"`
        : `attachment; filename="${path.basename(absolutePath)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
