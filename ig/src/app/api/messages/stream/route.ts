import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db, messages, threadMembers } from "@/db";
import { and, desc, eq, gt } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-Sent Events: polls Postgres every 2s for new messages
export async function GET(req: NextRequest) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) return new Response("unauth", { status: 401 });
  const threadId = req.nextUrl.searchParams.get("thread");
  if (!threadId) return new Response("missing thread", { status: 400 });

  // membership check
  const m = await db.select().from(threadMembers)
    .where(and(eq(threadMembers.threadId, threadId), eq(threadMembers.userId, uid))).limit(1);
  if (!m.length) return new Response("forbidden", { status: 403 });

  let lastSeen = new Date();
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (data: any) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      send({ ping: true });
      const interval = setInterval(async () => {
        try {
          const rows = await db.select().from(messages)
            .where(and(eq(messages.threadId, threadId), gt(messages.createdAt, lastSeen)))
            .orderBy(desc(messages.createdAt)).limit(50);
          for (const r of rows.reverse()) {
            send(r);
            if (r.createdAt > lastSeen) lastSeen = r.createdAt as Date;
          }
        } catch {}
      }, 2000);
      req.signal.addEventListener("abort", () => { clearInterval(interval); controller.close(); });
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" },
  });
}
