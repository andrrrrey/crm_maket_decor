import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveBuffer, deleteFile } from "@/lib/upload";
import { logAction, Actions } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const images = await prisma.projectImage.findMany({
    where: { projectId: params.id },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ data: images });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const imageType = (formData.get("imageType") as string) || "order";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveBuffer(buffer, "projects", file.name);

  const image = await prisma.projectImage.create({
    data: {
      projectId: params.id,
      fileName: saved.fileName,
      filePath: saved.filePath,
      imageType,
    },
  });

  await logAction(user.id, Actions.FILE_UPLOAD, "project", params.id, {
    fileName: file.name,
    imageType,
  });

  return NextResponse.json({ data: image }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });

  const image = await prisma.projectImage.findUnique({ where: { id: imageId } });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFile(image.filePath);
  await prisma.projectImage.delete({ where: { id: imageId } });

  await logAction(user.id, Actions.FILE_DELETE, "project", params.id, {
    imageId,
  });

  return NextResponse.json({ message: "Deleted" });
}
