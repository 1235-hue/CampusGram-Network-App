"use client";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function StoriesBarClient({ items }: { items: Array<{ authorId: string; username: string; image: string | null; hasUnviewed: boolean }> }) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar py-3 border-b border-ig-borderdark mb-2">
      <Link href="/stories/new" className="flex flex-col items-center gap-1 shrink-0 w-16">
        <div className="relative w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-ig-borderdark">
          <Plus className="w-6 h-6" />
        </div>
        <span className="text-[11px]">Your story</span>
      </Link>
      {items.map((s) => (
        <Link key={s.authorId} href={`/stories/${s.username}`} className="flex flex-col items-center gap-1 shrink-0 w-16">
          <div className={cn("story-ring", !s.hasUnviewed && "viewed")}>
            <div className="bg-black p-0.5 rounded-full">
              <Image src={s.image || "/default-avatar.png"} alt="" width={56} height={56} className="rounded-full bg-zinc-800" />
            </div>
          </div>
          <span className="text-[11px] truncate w-full text-center">{s.username}</span>
        </Link>
      ))}
    </div>
  );
}
