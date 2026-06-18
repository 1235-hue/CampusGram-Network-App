import { db, posts, postMedia, users } from "@/db";
import { desc, eq, sql } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const rows = await db
    .select({ id: posts.id, url: sql<string>`(select url from ${postMedia} where ${postMedia.postId} = ${posts.id} order by position limit 1)` })
    .from(posts).orderBy(desc(posts.createdAt)).limit(60);

  return (
    <div className="max-w-4xl mx-auto p-1">
      <div className="grid grid-cols-3 gap-1">
        {rows.map((r) => (
          <Link key={r.id} href={`/p/${r.id}`} className="relative aspect-square bg-zinc-900">
            {r.url && <Image src={r.url} alt="" fill className="object-cover" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
