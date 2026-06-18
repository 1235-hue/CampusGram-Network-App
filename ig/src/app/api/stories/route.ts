import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, stories } from "@/db";
import { uploadMedia } from "@/lib/uploads";

export async function POST(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  const caption = (fd.get("caption") as string) || null;
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });
  const { url, kind } = await uploadMedia(file);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [s] = await db.insert(stories).values({
    authorId: uid, mediaUrl: url, mediaKind: kind, caption, expiresAt: expires,
  }).returning();
  return NextResponse.json(s);
}
