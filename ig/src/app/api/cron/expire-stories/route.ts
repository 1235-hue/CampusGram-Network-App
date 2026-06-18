import { NextResponse } from "next/server";
import { db, stories } from "@/db";
import { lt } from "drizzle-orm";

export async function GET() {
  // Vercel cron — delete expired stories
  const r = await db.delete(stories).where(lt(stories.expiresAt, new Date())).returning({ id: stories.id });
  return NextResponse.json({ deleted: r.length });
}
