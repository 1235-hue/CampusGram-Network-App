import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, posts, postMedia, notifications, follows } from "@/db";
import { uploadMedia } from "@/lib/uploads";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const fd = await req.formData();
  const files = fd.getAll("files").filter((f): f is File => f instanceof File);
  const caption = (fd.get("caption") as string) || "";
  if (!files.length) return NextResponse.json({ error: "no files" }, { status: 400 });

  const uploaded = await Promise.all(files.map(uploadMedia));
  const kind = uploaded.length > 1 ? "carousel" : uploaded[0].kind === "video" ? "video" : "image";
  const [p] = await db.insert(posts).values({ authorId: uid, caption, kind: kind as any }).returning();
  await db.insert(postMedia).values(uploaded.map((m, i) => ({ postId: p.id, url: m.url, kind: m.kind, position: i })));

  // Notify followers (best-effort)
  await db.execute(sql`
    insert into notifications (recipient_id, actor_id, kind, post_id)
    select follower_id, ${uid}::uuid, 'mention'::notif_kind, ${p.id}::uuid from follows where following_id = ${uid}::uuid
  `).catch(() => {});

  return NextResponse.json({ id: p.id });
}
