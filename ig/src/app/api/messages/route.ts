import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, threads, threadMembers, messages, notifications } from "@/db";
import { and, eq, sql } from "drizzle-orm";

// Create or find a 1:1 thread
export async function POST(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { recipientId, body, threadId } = await req.json();

  let tid = threadId;
  if (!tid) {
    // find existing 1:1
    const found = await db.execute<{ id: string }>(sql`
      select t.id from threads t
      join thread_members a on a.thread_id = t.id and a.user_id = ${uid}::uuid
      join thread_members b on b.thread_id = t.id and b.user_id = ${recipientId}::uuid
      group by t.id having count(*) = 2 limit 1
    `);
    if (found.rows?.length) tid = (found.rows[0] as any).id;
    else {
      const [t] = await db.insert(threads).values({}).returning();
      await db.insert(threadMembers).values([
        { threadId: t.id, userId: uid },
        { threadId: t.id, userId: recipientId },
      ]);
      tid = t.id;
    }
  }

  if (body) {
    const [m] = await db.insert(messages).values({ threadId: tid, senderId: uid, body }).returning();
    await db.update(threads).set({ lastMessageAt: new Date() }).where(eq(threads.id, tid));
    await db.insert(notifications).values({ recipientId, actorId: uid, kind: "message", threadId: tid });
    return NextResponse.json({ threadId: tid, message: m });
  }
  return NextResponse.json({ threadId: tid });
}
