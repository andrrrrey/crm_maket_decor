import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveBuffer, deleteFile } from "@/lib/upload";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  if (user.role !== "DIRECTOR" && user.role !== "DESIGNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mockup = await prisma.mockup.findUnique({ where: { id: params.id } });
  if (!mockup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "DESIGNER" && mockup.designerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const zone = (formData.get("zone") as string) || "other";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveBuffer(buffer, "mockups", file.name);

  const image = await prisma.mockupImageFile.create({
    data: {
      mockupId: params.id,
      fileName: saved.fileName,
      filePath: saved.filePath,
      zone,
    },
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

  if (user.role !== "DIRECTOR" && user.role !== "DESIGNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });

  const image = await prisma.mockupImageFile.findUnique({
    where: { id: imageId },
    include: { mockup: true },
  });

  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "DESIGNER" && image.mockup.designerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteFile(image.filePath);
  await prisma.mockupImageFile.delete({ where: { id: imageId } });

  return NextResponse.json({ message: "Deleted" });
}
