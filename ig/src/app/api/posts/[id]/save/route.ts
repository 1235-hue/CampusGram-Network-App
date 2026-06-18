import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, saves } from "@/db";
import { and, eq } from "drizzle-orm";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await db.insert(saves).values({ postId: id, userId: uid }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await db.delete(saves).where(and(eq(saves.postId, id), eq(saves.userId, uid)));
  return NextResponse.json({ ok: true });
}
