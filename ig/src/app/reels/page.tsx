import { db, posts, postMedia, users } from "@/db";
import { desc, eq } from "drizzle-orm";
import { ReelsPlayer } from "@/components/ReelsPlayer";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const rows = await db
    .select({
      id: posts.id, caption: posts.caption, audioTitle: posts.audioTitle,
      url: postMedia.url, username: users.username, image: users.image,
    })
    .from(posts)
    .innerJoin(postMedia, eq(postMedia.postId, posts.id))
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(eq(posts.kind, "reel"))
    .orderBy(desc(posts.createdAt))
    .limit(20);

  return <ReelsPlayer reels={rows} />;
}
