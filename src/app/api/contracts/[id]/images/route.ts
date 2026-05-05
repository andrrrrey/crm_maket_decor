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
  if (user.role !== "DIRECTOR" && user.role !== "MANAGER" && user.role !== "PRODUCTION") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const deleteId = formData.get("deleteId") as string | null;

  if (deleteId) {
    const img = await prisma.contractImage.findUnique({ where: { id: deleteId } });
    if (img) {
      await deleteFile(img.filePath);
      await prisma.contractImage.delete({ where: { id: deleteId } });
    }
    return NextResponse.json({ message: "Deleted" });
  }

  const file = formData.get("file") as File | null;
  const imageType = (formData.get("imageType") as string) || "hall";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await saveBuffer(buffer, "contracts/images", file.name);

  const image = await prisma.contractImage.create({
    data: {
      contractId: params.id,
      fileName: saved.fileName,
      filePath: saved.filePath,
      imageType,
    },
  });

  return NextResponse.json({ data: image }, { status: 201 });
}
