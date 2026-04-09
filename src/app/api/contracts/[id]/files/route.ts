import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction, Actions } from "@/lib/logger";
import { saveBuffer, deleteFile } from "@/lib/upload";
import { shouldFilterByManager } from "@/lib/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const contract = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (shouldFilterByManager(user.role) && contract.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const files = await prisma.contractFile.findMany({
    where: { contractId: params.id },
    orderBy: { uploadedAt: "desc" },
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

  const contract = await prisma.contract.findUnique({ where: { id: params.id } });
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (shouldFilterByManager(user.role) && contract.managerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const fileType = (formData.get("fileType") as string) || "other";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const subDir = fileType === "invoice" ? "invoices" : "contracts";
  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveBuffer(buffer, subDir, file.name);

  const contractFile = await prisma.contractFile.create({
    data: {
      contractId: params.id,
      fileName: saved.fileName,
      filePath: saved.filePath,
      fileSize: saved.fileSize,
      fileType,
    },
  });

  await logAction(user.id, Actions.FILE_UPLOAD, "contract", params.id, {
    fileName: file.name,
    fileType,
  });

  return NextResponse.json({ data: contractFile }, { status: 201 });
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

  const file = await prisma.contractFile.findUnique({ where: { id: fileId } });
  if (!file || file.contractId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteFile(file.filePath);
  await prisma.contractFile.delete({ where: { id: fileId } });
  await logAction(user.id, Actions.FILE_DELETE, "contract", params.id, { fileId });

  return NextResponse.json({ message: "Deleted" });
}
