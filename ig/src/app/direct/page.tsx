import { db, threads, threadMembers, users, messages } from "@/db";
import { auth } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  const rows = await db.execute<any>(sql`
    select t.id, t.last_message_at,
      (select json_agg(json_build_object('id', u.id, 'username', u.username, 'image', u.image))
       from thread_members tm join users u on u.id = tm.user_id
       where tm.thread_id = t.id and tm.user_id <> ${uid}::uuid) as others,
      (select body from messages where thread_id = t.id order by created_at desc limit 1) as last_body
    from threads t
    join thread_members me on me.thread_id = t.id and me.user_id = ${uid}::uuid
    order by t.last_message_at desc limit 50
  `);

  return (
    <div className="max-w-2xl mx-auto py-4">
      <h1 className="text-xl font-bold px-4 mb-4">Messages</h1>
      <ul>
        {(rows.rows as any[]).map((t) => {
          const other = t.others?.[0];
          return (
            <li key={t.id}>
              <Link href={`/direct/${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900">
                <Image src={other?.image || "/default-avatar.png"} alt="" width={48} height={48} className="rounded-full bg-zinc-800" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{other?.username}</div>
                  <div className="text-xs text-ig-muted truncate">{t.last_body || "Start a conversation"}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
