import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveBuffer } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const subDir = (formData.get("dir") as string) || "misc";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || "52428800");
  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length > MAX_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const saved = await saveBuffer(buffer, subDir, file.name);
  return NextResponse.json({ data: saved });
}
