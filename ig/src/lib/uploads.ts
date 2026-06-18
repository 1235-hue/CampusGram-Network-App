import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function uploadMedia(file: File): Promise<{ url: string; kind: "image" | "video" }> {
  const ext = file.name.split(".").pop() || "bin";
  const key = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const kind: "image" | "video" = file.type.startsWith("video") ? "video" : "image";

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, file, { access: "public", token: process.env.BLOB_READ_WRITE_TOKEN });
    return { url: blob.url, kind };
  }

  // Dev fallback — write to public/uploads
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, key), buf);
  return { url: `/uploads/${key}`, kind };
}
