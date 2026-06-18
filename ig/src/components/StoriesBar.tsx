import { db, stories, users, storyViews } from "@/db";
import { sql, desc, eq, and, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { StoriesBarClient } from "./StoriesBarClient";

export async function StoriesBar() {
  const session = await auth();
  const me = (session?.user as any)?.id as string;
  const rows = await db
    .select({
      authorId: stories.authorId,
      username: users.username,
      image: users.image,
      latest: sql<Date>`max(${stories.createdAt})`,
      hasUnviewed: sql<boolean>`bool_or(not exists(select 1 from ${storyViews} where ${storyViews.storyId} = ${stories.id} and ${storyViews.viewerId} = ${me}))`,
    })
    .from(stories)
    .innerJoin(users, eq(users.id, stories.authorId))
    .where(gt(stories.expiresAt, new Date()))
    .groupBy(stories.authorId, users.username, users.image)
    .orderBy(desc(sql`max(${stories.createdAt})`))
    .limit(20);

  return <StoriesBarClient items={rows.map((r) => ({ ...r, latest: r.latest as any }))} />;
}
