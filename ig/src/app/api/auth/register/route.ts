import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, users } from "@/db";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(30).regex(/^[a-z0-9._]+$/i),
  name: z.string().min(1).max(60),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const passwordHash = await bcrypt.hash(body.password, 10);
    await db.insert(users).values({ ...body, passwordHash, username: body.username.toLowerCase() });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Bad request" }, { status: 400 });
  }
}
