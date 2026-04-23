import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { saveBuffer, deleteFile } from "@/lib/upload";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const files = await prisma.estimateFile.findMany({
    where: { clientId: params.id },
    orderBy: { version: "asc" },
  });

  return NextResponse.json({ data: files });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const isTeamVersion = formData.get("isTeamVersion") === "true";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Определить версию (следующая после последней)
  const lastFile = await prisma.estimateFile.findFirst({
    where: { clientId: params.id },
    orderBy: { version: "desc" },
  });
  const version = (lastFile?.version ?? 0) + 1;

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveBuffer(buffer, "estimates", file.name);

  const estimateFile = await prisma.estimateFile.create({
    data: {
      clientId: params.id,
      fileName: saved.fileName,
      filePath: saved.filePath,
      fileSize: saved.fileSize,
      version,
      isTeamVersion,
    },
  });

  await logAction(user.id, Actions.FILE_UPLOAD, "client", params.id, {
    fileName: file.name,
    version,
  });

  return NextResponse.json({ data: estimateFile }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

  const file = await prisma.estimateFile.findUnique({ where: { id: fileId } });
  if (!file || file.clientId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteFile(file.filePath);
  await prisma.estimateFile.delete({ where: { id: fileId } });
  await logAction(user.id, Actions.FILE_DELETE, "client", params.id, { fileId });

  return NextResponse.json({ message: "Deleted" });
}
