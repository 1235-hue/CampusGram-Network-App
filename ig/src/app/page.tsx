import { db, posts, postMedia, users, likes, saves, comments } from "@/db";
import { desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { PostCard } from "@/components/PostCard";
import { StoriesBar } from "@/components/StoriesBar";
import { Composer } from "@/components/Composer";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await auth();
  const me = (session?.user as any)?.id as string;

  const rows = await db
    .select({
      post: posts,
      author: users,
      likeCount: sql<number>`(select count(*) from ${likes} where ${likes.postId} = ${posts.id})`,
      commentCount: sql<number>`(select count(*) from ${comments} where ${comments.postId} = ${posts.id})`,
      liked: sql<boolean>`exists(select 1 from ${likes} where ${likes.postId} = ${posts.id} and ${likes.userId} = ${me})`,
      saved: sql<boolean>`exists(select 1 from ${saves} where ${saves.postId} = ${posts.id} and ${saves.userId} = ${me})`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .orderBy(desc(posts.createdAt))
    .limit(30);

  const ids = rows.map((r) => r.post.id);
  const media = ids.length
    ? await db.select().from(postMedia).where(sql`${postMedia.postId} in ${ids}`).orderBy(postMedia.position)
    : [];
  const byPost = new Map<string, typeof media>();
  for (const m of media) {
    const arr = byPost.get(m.postId) ?? [];
    arr.push(m);
    byPost.set(m.postId, arr);
  }

  return (
    <div className="max-w-[470px] mx-auto py-4 px-2">
      <StoriesBar />
      <Composer />
      <div className="space-y-6 mt-4">
        {rows.map((r) => (
          <PostCard
            key={r.post.id}
            post={r.post}
            author={r.author}
            media={byPost.get(r.post.id) ?? []}
            likeCount={Number(r.likeCount)}
            commentCount={Number(r.commentCount)}
            liked={!!r.liked}
            saved={!!r.saved}
          />
        ))}
        {rows.length === 0 && (
          <div className="text-center text-ig-muted py-20">
            <p>No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </div>
  );
}
