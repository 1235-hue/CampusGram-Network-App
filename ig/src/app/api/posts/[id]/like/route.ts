import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, likes, posts, notifications } from "@/db";
import { and, eq } from "drizzle-orm";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await db.insert(likes).values({ postId: id, userId: uid }).onConflictDoNothing();
  const [p] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (p && p.authorId !== uid) {
    await db.insert(notifications).values({ recipientId: p.authorId, actorId: uid, kind: "like", postId: id });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  await db.delete(likes).where(and(eq(likes.postId, id), eq(likes.userId, uid)));
  return NextResponse.json({ ok: true });
}
