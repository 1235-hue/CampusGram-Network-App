import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, follows, notifications } from "@/db";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { targetId } = await req.json();
  if (!targetId || targetId === uid) return NextResponse.json({ error: "bad" }, { status: 400 });
  await db.insert(follows).values({ followerId: uid, followingId: targetId }).onConflictDoNothing();
  await db.insert(notifications).values({ recipientId: targetId, actorId: uid, kind: "follow" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { targetId } = await req.json();
  await db.delete(follows).where(and(eq(follows.followerId, uid), eq(follows.followingId, targetId)));
  return NextResponse.json({ ok: true });
}
