import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, comments, posts, notifications } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { postId, body, parentId } = await req.json();
  if (!postId || !body) return NextResponse.json({ error: "bad" }, { status: 400 });
  const [c] = await db.insert(comments).values({ postId, authorId: uid, body, parentId }).returning();
  const [p] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (p && p.authorId !== uid) {
    await db.insert(notifications).values({ recipientId: p.authorId, actorId: uid, kind: "comment", postId, commentId: c.id });
  }
  return NextResponse.json(c);
}
