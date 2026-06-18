import { db, users, posts, follows, postMedia } from "@/db";
import { auth } from "@/lib/auth";
import { and, desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";
import { Grid3x3, Bookmark, Film } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();
  const me = (session?.user as any)?.id;
  const [u] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!u) notFound();

  const [{ postCount }] = await db.select({ postCount: sql<number>`count(*)` }).from(posts).where(eq(posts.authorId, u.id));
  const [{ followers }] = await db.select({ followers: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, u.id));
  const [{ following }] = await db.select({ following: sql<number>`count(*)` }).from(follows).where(eq(follows.followerId, u.id));
  const isFollowing = me ? (await db.select().from(follows).where(and(eq(follows.followerId, me), eq(follows.followingId, u.id))).limit(1)).length > 0 : false;

  const grid = await db
    .select({ id: posts.id, url: sql<string>`(select url from ${postMedia} where ${postMedia.postId} = ${posts.id} order by position limit 1)` })
    .from(posts).where(eq(posts.authorId, u.id)).orderBy(desc(posts.createdAt));

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex items-center gap-6 md:gap-16 mb-8">
        <Image src={u.image || "/default-avatar.png"} alt="" width={150} height={150} className="rounded-full bg-zinc-800 w-20 h-20 md:w-36 md:h-36" />
        <div className="flex-1">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-xl">{u.username}</h1>
            {me === u.id ? (
              <Link href="/settings" className="px-4 py-1.5 bg-zinc-800 rounded text-sm font-semibold">Edit profile</Link>
            ) : (
              <FollowButton targetId={u.id} initial={isFollowing} />
            )}
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <span><b>{postCount}</b> posts</span>
            <span><b>{followers}</b> followers</span>
            <span><b>{following}</b> following</span>
          </div>
          <div className="mt-4">
            <div className="font-semibold text-sm">{u.name}</div>
            <div className="text-sm whitespace-pre-line">{u.bio}</div>
            {u.website && <a href={u.website} className="text-sm text-ig-accent">{u.website}</a>}
          </div>
        </div>
      </header>

      <div className="border-t border-ig-borderdark flex justify-center gap-12 text-xs uppercase tracking-wider text-ig-muted">
        <button className="flex items-center gap-2 py-3 border-t border-white -mt-px text-white"><Grid3x3 className="w-3 h-3" /> Posts</button>
        <button className="flex items-center gap-2 py-3"><Film className="w-3 h-3" /> Reels</button>
        <button className="flex items-center gap-2 py-3"><Bookmark className="w-3 h-3" /> Saved</button>
      </div>

      <div className="grid grid-cols-3 gap-1 mt-1">
        {grid.map((g) => (
          <Link key={g.id} href={`/p/${g.id}`} className="relative aspect-square bg-zinc-900">
            {g.url && <Image src={g.url} alt="" fill className="object-cover" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
