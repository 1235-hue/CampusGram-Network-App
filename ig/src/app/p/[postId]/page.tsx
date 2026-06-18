import { db, posts, postMedia, users, comments, likes } from "@/db";
import { eq, asc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const session = await auth();
  const me = (session?.user as any)?.id;
  const [row] = await db.select({ post: posts, author: users }).from(posts).innerJoin(users, eq(users.id, posts.authorId)).where(eq(posts.id, postId));
  if (!row) notFound();
  const media = await db.select().from(postMedia).where(eq(postMedia.postId, postId)).orderBy(postMedia.position);
  const cmts = await db.select({ id: comments.id, body: comments.body, createdAt: comments.createdAt, author: users.username }).from(comments).innerJoin(users, eq(users.id, comments.authorId)).where(eq(comments.postId, postId)).orderBy(asc(comments.createdAt));
  const [{ likeCount }] = await db.select({ likeCount: sql<number>`count(*)` }).from(likes).where(eq(likes.postId, postId));

  return (
    <div className="max-w-[470px] mx-auto py-4 px-2">
      <PostCard post={row.post as any} author={row.author as any} media={media as any} likeCount={Number(likeCount)} commentCount={cmts.length} liked={false} saved={false} />
      <div className="mt-4 space-y-2">
        {cmts.map((c) => (
          <div key={c.id} className="text-sm"><b className="mr-2">{c.author}</b>{c.body}</div>
        ))}
      </div>
    </div>
  );
}
