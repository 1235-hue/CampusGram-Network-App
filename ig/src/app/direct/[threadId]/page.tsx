import { db, messages, threadMembers, users } from "@/db";
import { auth } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import { DMThread } from "@/components/DMThread";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const session = await auth();
  const uid = (session?.user as any)?.id;
  const me = await db.select().from(threadMembers)
    .where(and(eq(threadMembers.threadId, threadId), eq(threadMembers.userId, uid))).limit(1);
  if (!me.length) notFound();

  const initial = await db.select({
    id: messages.id, body: messages.body, mediaUrl: messages.mediaUrl,
    senderId: messages.senderId, createdAt: messages.createdAt,
    senderName: users.username, senderImage: users.image,
  })
  .from(messages).innerJoin(users, eq(users.id, messages.senderId))
  .where(eq(messages.threadId, threadId)).orderBy(asc(messages.createdAt)).limit(100);

  return <DMThread threadId={threadId} me={uid} initial={initial as any} />;
}
