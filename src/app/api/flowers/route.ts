import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveBuffer, deleteFile } from "@/lib/upload";

function generateArticleNumber(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  const flowers = await prisma.flower.findMany({
    where: categoryId ? { categoryId } : {},
    include: { category: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: flowers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "DIRECTOR" && user.role !== "PRODUCTION") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const deleteId = formData.get("deleteId") as string | null;

    if (deleteId) {
      const flower = await prisma.flower.findUnique({ where: { id: deleteId } });
      if (flower?.photoUrl) await deleteFile(flower.photoUrl);
      await prisma.flower.delete({ where: { id: deleteId } });
      return NextResponse.json({ message: "Deleted" });
    }

    const id = formData.get("id") as string | null;
    const photoFile = formData.get("photo") as File | null;

    const fields = {
      categoryId: (formData.get("categoryId") as string) || null,
      name: (formData.get("name") as string) || "",
      color: (formData.get("color") as string) || null,
      material: (formData.get("material") as string) || null,
      height: formData.get("height") ? parseInt(formData.get("height") as string) : null,
      purchaseDate: formData.get("purchaseDate") ? new Date(formData.get("purchaseDate") as string) : null,
      yearBought: (formData.get("yearBought") as string) || null,
      quantity: parseInt((formData.get("quantity") as string) || "0"),
      pricePerUnit: formData.get("pricePerUnit") ? parseFloat(formData.get("pricePerUnit") as string) : null,
      articleNumber: (formData.get("articleNumber") as string) || null,
    };

    let photoUrl: string | undefined;
    if (photoFile && photoFile.size > 0) {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const saved = await saveBuffer(buffer, "flowers", photoFile.name);
      photoUrl = saved.filePath;
    }

    if (id) {
      const updated = await prisma.flower.update({
        where: { id },
        data: { ...fields, ...(photoUrl ? { photoUrl } : {}) },
      });
      return NextResponse.json({ data: updated });
    }

    if (!fields.name.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const flower = await prisma.flower.create({
      data: { ...fields, ...(photoUrl ? { photoUrl } : {}), articleNumber: fields.articleNumber || generateArticleNumber() } as any,
    });
    return NextResponse.json({ data: flower }, { status: 201 });
  }

  const body = await req.json();

  if (body.deleteId) {
    const flower = await prisma.flower.findUnique({ where: { id: body.deleteId } });
    if (flower?.photoUrl) await deleteFile(flower.photoUrl);
    await prisma.flower.delete({ where: { id: body.deleteId } });
    return NextResponse.json({ message: "Deleted" });
  }

  return NextResponse.json({ error: "Bad request" }, { status: 400 });
}
